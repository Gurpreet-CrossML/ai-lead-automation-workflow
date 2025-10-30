import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

// Helper function to serialize BigInt and Date values
function serializeLeads(leads) {
  return leads.map((lead) => {
    const out = {};
    for (const [key, value] of Object.entries(lead)) {
      if (typeof value === 'bigint') {
        // convert BigInt to string for JSON
        out[key] = value.toString();
      } else if (value instanceof Date) {
        // convert Date to ISO string
        out[key] = value.toISOString();
      } else {
        out[key] = value;
      }
    }
    return out;
  });
}

// GET /api/leads - Get all leads
export async function GET() {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const leads = await prisma.lead_data.findMany({
      orderBy: {
        zoominfo_contact_id: 'desc'
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

// POST /api/leads - Create a new lead
export async function POST(request) {
  try {
    const data = await request.json();
    
    const lead = await prisma.lead_data.create({
      data: {
        zoominfo_contact_id: BigInt(data.zoominfo_contact_id),
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name,
        salutation: data.salutation,
        suffix: data.suffix,
        job_title: data.job_title,
        management_level: data.management_level,
        company_name: data.company_name,
        company_website: data.company_website,
        direct_phone: data.direct_phone,
        mobile_phone: data.mobile_phone,
        email: data.email,
        email_domain: data.email_domain,
        linkedin_profile_url: data.linkedin_profile_url,
        contact_accuracy_score: data.contact_accuracy_score,
        contact_accuracy_grade: data.contact_accuracy_grade,
        job_start_date: data.job_start_date ? new Date(data.job_start_date) : null,
        country: data.country,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        // new lifecycle fields
        status: data.status ?? 'new',
        last_email_sent_at: data.last_email_sent_at ? new Date(data.last_email_sent_at) : null,
        last_replied_at: data.last_replied_at ? new Date(data.last_replied_at) : null,
        follow_up_count: typeof data.follow_up_count === 'number' ? data.follow_up_count : (data.follow_up_count ? Number(data.follow_up_count) : 0),
        thread_id: data.thread_id,
        next_follow_up_at: data.next_follow_up_at ? new Date(data.next_follow_up_at) : null,
        meeting_scheduled_at: data.meeting_scheduled_at ? new Date(data.meeting_scheduled_at) : null
      }
    });

    // Serialize the lead data before sending (use generic serializer)
    const serializedLead = serializeLeads([lead])[0];

    return NextResponse.json(serializedLead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}