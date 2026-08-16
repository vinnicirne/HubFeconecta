import fs from 'fs';

async function check() {
  const token = "EAAQ3ZCZCqPzEABO7B3iZC8HnK4PqQZBYb6tFqVvM0ZBEB0S1eZCKrJ729NlG6dK0ZByHj6kC5ZAz77wSjU4cKx6WzZC5LdI9u61VpZAZA0cBZBx9n2pB70CZA855yKqA5ZAlL701o8wWwF36d3B6UuN76D3W2422kIZBOI3TqL4yG4ZAjJ3d1ZCN7s8D6s6e8cI1U60o59V1ZAM56R7dZCQwZDZD"; // from test_meta.mjs in their project

  // get IG account ID
  const igReq = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
  const igRes = await igReq.json();
  const igId = igRes?.instagram_business_account?.id;

  if (!igId) {
    console.log("No IG ID");
    return;
  }

  // get latest media
  const mediaReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/media?fields=id,caption,timestamp&limit=5&access_token=${token}`);
  const mediaRes = await mediaReq.json();

  console.log("Latest IG Posts:");
  mediaRes.data.forEach(m => {
    console.log(`[${m.timestamp}] ${m.caption?.substring(0, 50).replace(/\n/g, ' ')}`);
  });
}

check();
