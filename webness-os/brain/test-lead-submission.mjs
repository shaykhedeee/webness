async function testFunnel() {
  const leadData = {
    websiteUrl: "arogbharatdoctor.com",
    businessType: "Healthcare or clinic",
    targetLocation: "Bangalore, India",
    monthlyLeadGoal: "20 qualified leads",
    currentTools: "WordPress, GA4",
    biggestBottleneck: "Page load speed is slow and visitors leave before clicking WhatsApp.",
    email: "founder@arogbharat.com",
    phoneOrWhatsApp: "+919876543210"
  };

  console.log("--- TEST 1: Lead Submission ---");
  console.log("Submitting test lead to http://localhost:3002/api/audit-leads...");
  
  try {
    const postRes = await fetch("http://localhost:3002/api/audit-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    });

    if (!postRes.ok) {
      console.error("POST request failed:", postRes.status, await postRes.text());
      return;
    }

    const postPayload = await postRes.json();
    console.log("POST Success payload:", JSON.stringify(postPayload, null, 2));

    const leadId = postPayload.id;
    if (!leadId) {
      console.error("No lead ID returned in response.");
      return;
    }

    console.log(`\nRetrieving submitted lead using GET http://localhost:3002/api/audit-leads?id=${leadId}...`);
    const getRes = await fetch(`http://localhost:3002/api/audit-leads?id=${leadId}`);
    
    if (!getRes.ok) {
      console.error("GET request failed:", getRes.status, await getRes.text());
      return;
    }

    const getPayload = await getRes.json();
    console.log("GET Success payload:", JSON.stringify(getPayload, null, 2));
    console.log("Lead funnel test passed successfully!");

    console.log("\n--- TEST 2: Waitlist Funnel ---");
    console.log("Getting initial count from http://localhost:3002/api/waitlist/count...");
    const countRes1 = await fetch("http://localhost:3002/api/waitlist/count");
    const countPayload1 = await countRes1.json();
    console.log("Initial Waitlist Count:", countPayload1.count);

    console.log("Submitting waitlist signup for test-founder@arogbharat.com...");
    const waitlistPost = await fetch("http://localhost:3002/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test-founder@arogbharat.com" })
    });
    
    if (!waitlistPost.ok) {
      console.error("Waitlist signup POST failed:", waitlistPost.status, await waitlistPost.text());
      return;
    }

    const waitlistPayload = await waitlistPost.json();
    console.log("Waitlist signup response:", JSON.stringify(waitlistPayload, null, 2));

    console.log("Getting updated count...");
    const countRes2 = await fetch("http://localhost:3002/api/waitlist/count");
    const countPayload2 = await countRes2.json();
    console.log("Updated Waitlist Count:", countPayload2.count);

    if (countPayload2.count === countPayload1.count + 1) {
      console.log("Waitlist count successfully incremented!");
      console.log("Waitlist test passed successfully!");
    } else {
      console.error(`Count mismatch: expected ${countPayload1.count + 1}, got ${countPayload2.count}`);
    }

    console.log("\nAll integration funnel tests passed successfully!");
  } catch (err) {
    console.error("An error occurred during verification:", err);
  }
}

testFunnel();
