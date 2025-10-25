/* =======================  Footer (Modern & Playful)  ======================= */

import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t-2 border-red-200/50 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute top-10 right-1/4 h-64 w-64 rounded-full bg-red-200/60 blur-3xl" />
        <div className="absolute -bottom-10 left-10 h-72 w-72 rounded-full bg-orange-200/60 blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Top: brand + cta blurb */}
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <a href="#home" className="group inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-red-500 text-white font-bold shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
              BS
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-blue-600">Beyond Speech</span>
          </a>

          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-white font-semibold shadow-lg transition hover:bg-blue-600 hover:shadow-xl hover:scale-105"
          >
            Get Started <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        {/* Middle: link columns */}
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {/* Column 1 */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Explore</h3>
            <ul className="font-body mt-4 space-y-2 text-sm text-neutral-600">
              <li><a className="hover:text-brand" href="#families">For Clients</a></li>
              <li><a className="hover:text-brand" href="#slps">For Providers</a></li>
              <li><a className="hover:text-brand" href="#services">Our Services</a></li>
              <li><a className="hover:text-brand" href="#og-camp">Special Programs</a></li>
              <li><a className="hover:text-brand" href="#how">How It Works</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Company</h3>
            <ul className="font-body mt-4 space-y-2 text-sm text-neutral-600">
              <li><a className="hover:text-brand" href="#about">About Us</a></li>
              <li><a className="hover:text-brand" href="#contact">Contact</a></li>
              <li><a className="hover:text-brand" href="#contact">Join Our Network</a></li>
              <li><a className="hover:text-brand" href="#faq">FAQ</a></li>
              <li><a className="hover:text-brand" href="#privacy">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Column 3: contact */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-neutral-900">Get in touch</h3>
            <ul className="font-body mt-4 space-y-3 text-sm text-neutral-700">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <a className="hover:text-brand" href="mailto:hello@beyondspeech.example">hello@beyondspeech.example</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-success" />
                <a className="hover:text-brand" href="tel:+10000000000">(000) 000-0000</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-info" />
                <span>Remote &amp; select in-person cities</span>
              </li>
            </ul>

            {/* Socials */}
            <div className="mt-4 flex items-center gap-3">
              <a aria-label="Instagram" className="rounded-full p-2 text-accent transition hover:bg-accent/10 hover:text-accent hover:scale-125" href="#" target="_blank" rel="noreferrer">
                <Instagram className="h-5 w-5" />
              </a>
              <a aria-label="Facebook" className="rounded-full p-2 text-brand transition hover:bg-brand/10 hover:text-brand hover:scale-125" href="#" target="_blank" rel="noreferrer">
                <Facebook className="h-5 w-5" />
              </a>
              <a aria-label="LinkedIn" className="rounded-full p-2 text-info transition hover:bg-info/10 hover:text-info hover:scale-125" href="#" target="_blank" rel="noreferrer">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom: legal + mini nav */}
        <div className="mt-10 border-t pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="font-body text-xs text-neutral-500">
              © {new Date().getFullYear()} Beyond Speech. Connecting families with exceptional speech-language providers. Private-pay services with superbill support.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <a className="font-body text-neutral-500 hover:text-brand" href="#privacy">Privacy</a>
              <a className="font-body text-neutral-500 hover:text-brand" href="#terms">Terms</a>
              <a className="font-body text-neutral-500 hover:text-brand" href="#accessibility">Accessibility</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
