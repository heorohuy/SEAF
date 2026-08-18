export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      name,
      email,
      reason,
      message,
      website,
    } = req.body || {};

    // Simple honeypot spam protection.
    if (website) {
      return res.status(200).json({
        success: true,
      });
    }

    if (!name || !email || !reason || !message) {
      return res.status(400).json({
        error: "Missing required fields.",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        error: "Name is too long.",
      });
    }

    if (email.length > 254) {
      return res.status(400).json({
        error: "Email is too long.",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        error: "Message is too long.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        error: "Invalid email address.",
      });
    }

    // Access process through globalThis so this file remains compatible
    // with an ESLint configuration that does not define Node globals.
    const githubToken = globalThis.process?.env?.GITHUB_TOKEN;

    if (!githubToken) {
      console.error("GITHUB_TOKEN is not configured.");

      return res.status(500).json({
        error: "Contact system is not configured.",
      });
    }

    const issueTitle = `[CONTACT] ${reason} — ${name}`;

    const issueBody = [
      "## S.E.A.F. L.E.M.O.N. Contact Submission",
      "",
      `**Name:** ${name}`,
      `**Email:** ${email}`,
      `**Reason:** ${reason}`,
      "",
      "### Message",
      "",
      message,
      "",
      "---",
      "",
      "_Submitted through the S.E.A.F. L.E.M.O.N. contact form._",
    ].join("\n");

    const response = await fetch(
      "https://api.github.com/repos/heorohuy/SEAF/issues",
      {
        method: "POST",

        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "SEAF-Lemon-Contact-Form",
        },

        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ["contact"],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "GitHub API error:",
        response.status,
        errorText
      );

      return res.status(500).json({
        error: "Unable to submit message.",
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return res.status(500).json({
      error: "Unable to submit message.",
    });
  }
}