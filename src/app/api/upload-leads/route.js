// File: app/api/upload-leads/route.js
// Alternative version using axios with file type validation

import { NextResponse } from 'next/server';
import axios from 'axios';
import http from 'http';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Allowed file extensions and MIME types
const ALLOWED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/csv',
  'text/x-csv',
  'application/x-csv',
  'text/comma-separated-values',
  'text/x-comma-separated-values'
];

// Create a custom http agent with specific settings
const httpAgent = new http.Agent({
  keepAlive: false,
  maxSockets: 5,
  timeout: 30000,
  family: 4, // Force IPv4
});

export async function POST(request) {
  console.log('🚀 API Route called');
  console.log('📍 Webhook URL:', WEBHOOK_URL);
  
  if (!WEBHOOK_URL) {
    console.error('❌ N8N_WEBHOOK_URL not configured');
    return NextResponse.json(
      { error: 'Webhook URL not configured' },
      { status: 500 }
    );
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type by extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      console.log('❌ Invalid file type:', fileName);
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          message: 'Only Excel (.xls, .xlsx) and CSV (.csv) files are allowed',
          allowedTypes: ALLOWED_EXTENSIONS
        },
        { status: 400 }
      );
    }

    // Validate MIME type (additional check)
    const mimeType = file.type;
    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
      console.log('⚠️ Warning: MIME type mismatch:', mimeType);
      // Note: Some browsers may not send correct MIME types, so we log but don't block
    }

    console.log('📁 File received:', file.name, `(${file.size} bytes)`);
    console.log('✅ File type validated:', fileName.split('.').pop().toUpperCase());
    console.log('🔄 Forwarding to n8n webhook...');

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create FormData for axios
    const FormData = (await import('form-data')).default;
    const axiosFormData = new FormData();
    axiosFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
    });

    console.log('📤 Sending request with axios...');

    const response = await axios.post(WEBHOOK_URL, axiosFormData, {
      headers: {
        ...axiosFormData.getHeaders(),
        'Accept': '*/*',
        'User-Agent': 'NextJS-LeadUpload/1.0',
      },
      httpAgent: httpAgent,
      timeout: 30000, // 30 seconds
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: () => true, // Don't throw on any status
    });

    console.log('✅ Response received. Status:', response.status);
    console.log('📝 Response preview:', JSON.stringify(response.data).substring(0, 200));

    const responseData = response.data;

    if (response.status >= 200 && response.status < 300) {
      return NextResponse.json(responseData, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Webhook request failed', details: responseData },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('🚨 API Route error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      syscall: error.syscall,
    });
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error config:', {
        url: error.config?.url,
        method: error.config?.method,
      });
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            message: 'The webhook took too long to respond',
            details: 'Connection timeout after 30 seconds'
          },
          { status: 504 }
        );
      }
      
      if (error.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { 
            error: 'Connection refused',
            message: 'Cannot connect to n8n webhook server'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'API route is working',
    webhookConfigured: !!WEBHOOK_URL,
    webhookUrl: WEBHOOK_URL,
    allowedFileTypes: ALLOWED_EXTENSIONS,
    timestamp: new Date().toISOString()
  });
}