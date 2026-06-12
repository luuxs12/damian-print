import { sendMail } from "c:/Users/Administrator/Documents/Universidad/damian-print/backend/src/modules/mail/mail.service";

async function main() {
  console.log("Starting email test...");
  try {
    const res = await sendMail("test@example.com", "Test subject", "<p>Hello, this is a test email!</p>");
    console.log("Result:", res);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
