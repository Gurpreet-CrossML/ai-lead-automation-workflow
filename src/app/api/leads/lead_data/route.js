import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

// GET /api/leads/[id] - Get a single lead
export async function GET(request, { params }) {
  try {
    const id = BigInt(params.id);
    const lead = await prisma.lead_data.findUnique({
      where: {
        zoominfo_contact_id: id
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/leads/[id] - Update a lead
export async function PUT(request, { params }) {
  try {
    const id = BigInt(params.id);
    const data = await request.json();

    const updatedLead = await prisma.lead_data.update({
      where: {
        zoominfo_contact_id: id
      },
      data: {
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
        zip_code: data.zip_code
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(request, { params }) {
  try {
    const id = BigInt(params.id);
    await prisma.lead_data.delete({
      where: {
        zoominfo_contact_id: id
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}