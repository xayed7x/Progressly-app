import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Get Support & Feedback",
  description: "Get in touch with the Progressly team. We're here to help you maximize your productivity and achieve your goals. Contact us for support, feedback, or questions.",
  openGraph: {
    title: "Contact Progressly - Get Support & Feedback",
    description: "Get in touch with the Progressly team. We're here to help you maximize your productivity and achieve your goals. Contact us for support, feedback, or questions.",
    url: "https://progressly-app.vercel.app/contact",
  },
  twitter: {
    title: "Contact Progressly - Get Support & Feedback", 
    description: "Get in touch with the Progressly team. We're here to help you maximize your productivity and achieve your goals. Contact us for support, feedback, or questions.",
  },
};

export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl font-bold text-secondary mb-6">
          Get in Touch
        </h1>
        
        <p className="text-lg text-textLight/80 mb-8">
          We'd love to hear from you. Whether you have questions, feedback, or need support, 
          our team is here to help you make the most of Progressly.
        </p>
        
        <div className="bg-secondary/5 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold text-secondary mb-6">
            Contact Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-secondary mb-2">Support Email</h3>
              <p className="text-textLight/80">support@progressly-app.com</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-secondary mb-2">General Inquiries</h3>
              <p className="text-textLight/80">hello@progressly-app.com</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-secondary mb-2">Follow Us</h3>
              <p className="text-textLight/80">@progressly_app on Twitter</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-accent/10 p-6 rounded-lg">
          <h3 className="font-semibold text-secondary mb-3">Quick Response Times</h3>
          <p className="text-textLight/80">
            We typically respond to all inquiries within 24 hours. For urgent support issues, 
            please mention "URGENT" in your subject line.
          </p>
        </div>
      </div>
    </main>
  );
}
