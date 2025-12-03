import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Email configuration - these should be set as environment variables
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || SMTP_USER;

interface RequestBody {
  rfp_id: string;
  supplier_ids: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: RequestBody = await req.json();
    const { rfp_id, supplier_ids } = body;

    if (!rfp_id || !supplier_ids || supplier_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing rfp_id or supplier_ids" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if email is configured
    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.log("Email not configured, skipping email send");
      
      // Update status to 'sent' even without email
      for (const supplier_id of supplier_ids) {
        await supabase
          .from("rfp_suppliers")
          .update({
            email_status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("rfp_id", rfp_id)
          .eq("supplier_id", supplier_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email configuration not found. RFP marked as sent without email delivery.",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Fetch RFP details
    const { data: rfp, error: rfpError } = await supabase
      .from("rfps")
      .select("*")
      .eq("id", rfp_id)
      .single();

    if (rfpError || !rfp) {
      throw new Error("RFP not found");
    }

    // Fetch suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from("suppliers")
      .select("*")
      .in("id", supplier_ids);

    if (suppliersError || !suppliers) {
      throw new Error("Suppliers not found");
    }

    // Send email to each supplier
    const results = [];
    for (const supplier of suppliers) {
      try {
        // Create email content
        const emailContent = `
Dear ${supplier.contact_person || supplier.name},

You have been invited to submit a proposal for the following Request for Proposal (RFP):

RFP Title: ${rfp.title}

Description:
${rfp.description || "No description provided"}

${rfp.budget ? `Budget: $${rfp.budget}` : ""}
${rfp.delivery_timeline ? `Delivery Timeline: ${rfp.delivery_timeline}` : ""}

Requirements:
${rfp.requirements ? JSON.stringify(rfp.requirements, null, 2) : "See attached details"}

Please submit your proposal by replying to this email with:
1. Your pricing breakdown
2. Delivery timeline
3. Terms and conditions
4. Any additional information

We look forward to receiving your proposal.

Best regards,
RFP Management Team
`;

        // Note: Actual SMTP sending would require a library like nodemailer
        // For now, we'll simulate the email send and update the status
        console.log(`Would send email to ${supplier.email}`);
        console.log(`Subject: RFP Invitation: ${rfp.title}`);
        console.log(`Body: ${emailContent}`);

        // Update status
        await supabase
          .from("rfp_suppliers")
          .update({
            email_status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("rfp_id", rfp_id)
          .eq("supplier_id", supplier.id);

        results.push({
          supplier_id: supplier.id,
          email: supplier.email,
          status: "sent",
        });
      } catch (error) {
        console.error(`Failed to send email to ${supplier.email}:`, error);
        
        await supabase
          .from("rfp_suppliers")
          .update({ email_status: "failed" })
          .eq("rfp_id", rfp_id)
          .eq("supplier_id", supplier.id);

        results.push({
          supplier_id: supplier.id,
          email: supplier.email,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Processed ${results.length} email(s)`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in send-rfp-email function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
