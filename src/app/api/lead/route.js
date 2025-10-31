import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

// Helper function to serialize a single value
function serializeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(v => serializeValue(v));
  }
  if (typeof value === 'object') {
    return serializeObject(value);
  }
  return value;
}

// Helper function to serialize an object
function serializeObject(obj) {
  const serialized = {};
  for (const [key, value] of Object.entries(obj)) {
    serialized[key] = serializeValue(value);
  }
  return serialized;
}

// Helper function to serialize leads (handles nested objects like status_info)
function serializeLeads(leads) {
  return leads.map(lead => serializeObject(lead));
}

// GET /api/lead - Get all leads
export async function GET() {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const leads = await prisma.lead_data.findMany({
      orderBy: {
        zoominfo_contact_id: 'desc'
      },
      include: {
        status_info: true // Include the related status information
      }
    });
    
    // Serialize the leads data before sending
    const serializedLeads = serializeLeads(leads);
    
    return NextResponse.json(serializedLeads);
  } catch (error) {
    console.error('Database error:', error);
    
    if (error.code === 'P1001') {
      return NextResponse.json({ 
        error: 'Unable to connect to the database. Please check your database connection.',
        details: error.message 
      }, { status: 503 });
    }
    
    if (error.code === 'P2021') {
      return NextResponse.json({ 
        error: 'The table "lead_data" does not exist. Please check your database schema.',
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An error occurred while fetching leads',
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}