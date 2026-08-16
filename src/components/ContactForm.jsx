import { useState } from "react";
import "./ContactForm.css";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
    website: "",
  });

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to transmit message."
        );
      }

      setStatus("success");

      setForm({
        name: "",
        email: "",
        reason: "",
        message: "",
        website: "",
      });
    } catch (err) {
      console.error(err);

      setError(
        "TRANSMISSION FAILED. PLEASE TRY AGAIN."
      );

      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="contact-success">
        <div className="contact-success-status">
          TRANSMISSION RECEIVED
        </div>

        <h3>MESSAGE LOGGED</h3>

        <p>
          Your message has been successfully transmitted.
        </p>

        <span>
          Thank you for helping maintain the S.E.A.F.
          L.E.M.O.N. reference network.
        </span>
      </div>
    );
  }

  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit}
    >
      <div className="contact-form-row">
        <div className="contact-field">
          <label htmlFor="contact-name">
            NAME
          </label>

          <input
            id="contact-name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="ENTER NAME"
            autoComplete="name"
            maxLength={100}
            required
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">
            EMAIL
          </label>

          <input
            id="contact-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="ENTER EMAIL"
            autoComplete="email"
            maxLength={254}
            required
          />
        </div>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-reason">
          REASON FOR CONTACT
        </label>

        <select
          id="contact-reason"
          name="reason"
          value={form.reason}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            SELECT REASON
          </option>

          <option value="General Question">
            GENERAL QUESTION
          </option>

          <option value="Incorrect Information">
            REPORT INCORRECT INFORMATION
          </option>

          <option value="Bug Report">
            REPORT A BUG
          </option>

          <option value="Feature Request">
            FEATURE REQUEST
          </option>

          <option value="Copyright / Legal">
            COPYRIGHT / LEGAL
          </option>

          <option value="Other">
            OTHER
          </option>
        </select>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">
          MESSAGE
        </label>

        <textarea
          id="contact-message"
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="ENTER TRANSMISSION"
          rows={8}
          minLength={10}
          maxLength={5000}
          required
        />
      </div>

      {/* Honeypot */}
      <div
        className="contact-honeypot"
        aria-hidden="true"
      >
        <label htmlFor="contact-website">
          WEBSITE
        </label>

        <input
          id="contact-website"
          type="text"
          name="website"
          value={form.website}
          onChange={handleChange}
          tabIndex="-1"
          autoComplete="off"
        />
      </div>

      <div className="contact-form-footer">
        <span>
          INFORMATION PROVIDED THROUGH THIS FORM IS
          SUBJECT TO THE{" "}
          <a href="/privacy">
            PRIVACY POLICY
          </a>
          .
        </span>

        <button
          type="submit"
          disabled={status === "submitting"}
        >
          {status === "submitting"
            ? "TRANSMITTING..."
            : "TRANSMIT MESSAGE"}
        </button>
      </div>

      {status === "error" && (
        <div className="contact-submit-error">
          {error}
        </div>
      )}
    </form>
  );
}
