import { MapPin, Phone, Mail, Clock } from "lucide-react";

export function ContactInfo() {
  return (
    <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Get in Touch</h2>
        <p className="mt-1 text-sm text-slate-500">
          Have questions about our artisanal Ube Halaya products, custom orders, or bulk distribution? Reach out to our customer care team!
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3.5">
          <div className="rounded-xl bg-purple-50 p-2.5 text-[#451077]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Main Kitchen & Store</h3>
            <p className="text-sm font-medium text-slate-800">123 Good Shepherd Way, Baguio City, Philippines</p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5">
          <div className="rounded-xl bg-purple-50 p-2.5 text-[#451077]">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Hotline</h3>
            <p className="text-sm font-medium text-slate-800">+63 917 123 4567 / (074) 442 1234</p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5">
          <div className="rounded-xl bg-purple-50 p-2.5 text-[#451077]">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</h3>
            <p className="text-sm font-medium text-slate-800">support@brenhalaya.com</p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5">
          <div className="rounded-xl bg-purple-50 p-2.5 text-[#451077]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Operating Hours</h3>
            <p className="text-sm font-medium text-slate-800">Mon - Sat: 8:00 AM - 6:00 PM (PST)</p>
          </div>
        </div>
      </div>

      {/* Map Embed Placeholder */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 h-44 flex items-center justify-center text-slate-400 text-xs">
        <div className="text-center p-4">
          <MapPin className="mx-auto h-6 w-6 mb-1 text-purple-400" />
          <p className="font-medium text-slate-600">Baguio City Store Location</p>
          <p className="text-[11px] text-slate-400">Interactive Map Embed</p>
        </div>
      </div>
    </div>
  );
}
