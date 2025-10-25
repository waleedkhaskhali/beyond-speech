"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check, Calendar, MapPin, Video } from "lucide-react";
import { ServicesModern } from "@/components/ui/serviceModern";
import { SiteFooter } from "@/components/ui/siteFooter";
import { api } from '@/lib/api';

/** Minimal, professional, playful */
export default function BeyondSpeechLanding() {
  const [role, setRole] = useState<"family" | "slp" | "school" | "ot" | "pt" | "ota" | "pta">("family");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formData = new FormData(e.currentTarget);
      const templateParams = {
        role,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        message: formData.get('message') as string,
        timestamp: new Date().toLocaleString(),
        // Role-specific fields
        ...(role === 'family' && {
          clientName: formData.get('clientName') as string,
          age: formData.get('age') as string,
          goals: formData.get('goals') as string,
        }),
        ...(role === 'slp' && {
          state: formData.get('state') as string,
          availability: formData.get('availability') as string,
          expertise: formData.get('expertise') as string,
        }),
        ...(role === 'school' && {
          orgName: formData.get('orgName') as string,
          need: formData.get('need') as string,
        }),
      };

      // Send to backend API
      await api.submitContact({
        role,
        name: templateParams.name,
        email: templateParams.email,
        phone: templateParams.phone,
        message: templateParams.message,
      });

      setSubmitStatus('success');
      // Reset form
      if (formRef.current) {
        formRef.current.reset();
      }
      setRole('family');
    } catch (error) {
      console.error('Email sending failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 text-neutral-900">
      <SiteHeader />

     <section id="home" className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100">
      {/* Decorative blobs for liquid effect */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-slate-300/50 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-indigo-300/50 blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-yellow-300/50 blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>
      {/* Parent with known height + relative positioning */}
      <div className="relative h-[60vh] min-h-[420px] w-full">
        {/* OPTIONAL: lighten the photo a bit; lower opacity so you still see it */}
        <div className="absolute inset-0 bg-white/10" />
        
        {/* Content on top */}
        <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-center px-4 text-center">
          <div>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Expert Speech-Language Therapy
               <span className="block text-brand">That Fits Your Life</span>
            </h1>
          <p className="font-body mx-auto mt-4 max-w-2xl text-lg text-neutral-700">
      We connect families with skilled, culturally-responsive SLPs — and partner with providers seeking flexible, meaningful caseloads.
    </p>

    {/* ✅ Re-added CTA buttons */}
<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
  <a href="#contact">
    <Button variant="brand" size="lg" className="shadow-xl hover:shadow-2xl hover:scale-110 transition-all">Find a Provider</Button>
  </a>
  <a href="#contact">
    <Button variant="accent" size="lg" className="shadow-xl hover:shadow-2xl hover:scale-110 transition-all">Join Our Network</Button>
  </a>
</div>

          </div>
        </div>
      </div>
    </section>

      {/* HOW IT WORKS — clean steps, no borders/cards */}
 <section aria-labelledby="how" className="relative overflow-hidden bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100">
  {/* Decorative blobs */}
  <div className="pointer-events-none absolute inset-0 opacity-30">
    <div className="absolute top-10 -right-20 h-64 w-64 rounded-full bg-orange-200/60 blur-3xl" />
    <div className="absolute -bottom-10 -left-20 h-64 w-64 rounded-full bg-yellow-200/60 blur-3xl" />
  </div>
  <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
    <h2 id="how" className="font-heading text-3xl font-semibold tracking-tight text-center">
      How it works
    </h2>

    <ol className="mx-auto mt-10 grid max-w-3xl gap-8 sm:grid-cols-3">
      <Step n={1} color="brand" title="Tell us your needs" desc="Share your goals, schedule, and preferences with us." />
      <Step n={2} color="accent" title="We find your match" desc="Get paired with a licensed, vetted SLP who fits your needs." />
      <Step n={3} color="success" title="Start your journey" desc="Begin sessions on your schedule — remote or in-person." />
    </ol>
  </div>
</section>


      {/* FAMILIES — minimal content + illustration */}
      <section id="families" className="relative overflow-hidden bg-gradient-to-br from-cyan-100 via-teal-100 to-emerald-100">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-16 left-1/4 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />
          <div className="absolute bottom-20 -right-16 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <h2 className="font-heading text-3xl font-semibold tracking-tight">For Families & Individuals</h2>
              <p className="font-body mt-3 text-neutral-600">
                Quality speech-language support tailored to your unique needs. We match you with experienced providers who understand your goals and cultural background.
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-neutral-800">
                {[
                  "Expert SLPs matched to your needs",
                  "Remote & in-person options available",
                  "Flexible scheduling that works for you",
                  "Culturally-responsive care",
                  "Children, teens, and adults welcome",
                  "Private-pay with superbill support",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-success" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative order-1 aspect-[4/3] w-full overflow-hidden rounded-2xl md:order-2">
              <Image src="/illustration-families.svg" alt="" fill className="object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* SLPS — minimal content + illustration */}
      <section id="slps" className="relative overflow-hidden bg-gradient-to-br from-emerald-100 via-green-100 to-lime-100">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-16 h-72 w-72 rounded-full bg-indigo-200/60 blur-3xl" />
          <div className="absolute -bottom-16 right-1/4 h-80 w-80 rounded-full bg-blue-200/60 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image src="/illustration-slps.svg" alt="" fill className="object-contain" />
            </div>
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">For SLP Providers</h2>
              <p className="font-body mt-3 text-neutral-600">
                Join our growing network of speech-language pathologists. Build a caseload that aligns with your expertise, values, and schedule preferences.
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-neutral-800">
                {[
                  "Quality client referrals matched to your skills",
                  "Choose your schedule: days, evenings, weekends",
                  "Remote and in-person opportunities",
                  "Competitive compensation & fair rates",
                  "Supportive community & professional development",
                  "We handle admin, marketing & client matching",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-accent" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* OG CAMP — small, clean block */}
      <section id="og-camp" className="relative overflow-hidden bg-gradient-to-br from-lime-100 via-yellow-100 to-amber-100">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-cyan-200/60 blur-3xl" />
          <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-teal-200/60 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">Special Programs</h2>
              <p className="font-body mt-3 text-neutral-600">
                Beyond one-on-one therapy, we offer specialized small-group programs like OG Camp — structured literacy support using Orton-Gillingham methods for K-5 learners.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-neutral-800">
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand" />
                  Rolling enrollment throughout the year
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-success" />
                  Remote & in-person options available
                </p>
                <p className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-info" />
                  Small groups for personalized attention
                </p>
              </div>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image src="/illustration-og.svg" alt="" fill className="object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* RATES — simple, honest */}
    <ServicesModern />
      {/* CONTACT — slimmer form, mobile-first */}
  <section id="contact" className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-100 to-red-100">
  {/* Decorative blobs */}
  <div className="pointer-events-none absolute inset-0 opacity-30">
    <div className="absolute top-20 -left-20 h-80 w-80 rounded-full bg-emerald-200/60 blur-3xl" />
    <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-200/60 blur-3xl" />
  </div>
  <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
    <div className="text-center">
      <h2 className="font-heading text-3xl font-semibold tracking-tight">
        Get Started Today
      </h2>
      <p className="font-body mx-auto mt-3 max-w-xl text-neutral-600">
        Whether you&apos;re seeking services or looking to join our provider network, we&apos;d love to connect. We&apos;ll respond within 1–2 business days.
      </p>
    </div>

    <form ref={formRef} onSubmit={handleSubmit} className="mt-10 rounded-2xl bg-white p-8 shadow-xl ring-2 ring-blue-200 hover:ring-blue-300 transition-all">
      {/* Role selector */}
      <div className="mb-6">
        <label htmlFor="role" className="font-body text-sm font-medium">
          I am a…
        </label>
        <select
          id="role"
          className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30"
          value={role}
          onChange={(e) => setRole(e.target.value as "family" | "slp" | "school" | "ot" | "pt" | "ota" | "pta")}
        >
          <option value="family">Parent/Guardian</option>
          <option value="slp">Speech-Language Pathologist</option>
          <option value="ot">Occupational Therapist</option>
          <option value="pt">Physical Therapist</option>
          <option value="ota">Occupational Therapist Assistant</option>
          <option value="pta">Physical Therapist Assistant</option>
          <option value="school">School / Organization</option>
        </select>
      </div>

      {/* Contact details */}
      <div className="grid gap-6 sm:grid-cols-2">
        <InputField id="name" label="Full Name" placeholder="Your name" />
        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="name@example.com"
        />
        <div className="sm:col-span-2">
          <InputField id="phone" label="Phone" placeholder="(###) ###-####" />
        </div>
      </div>

      {/* Conditional sections */}
      {role === "family" && (
        <div className="mt-6 grid gap-6 rounded-xl bg-neutral-50 p-6">
          <h3 className="font-heading text-base font-medium text-neutral-800">
            Tell Us About Your Needs
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField
              id="clientName"
              label="Client Name"
              placeholder="Name of person receiving services"
            />
            <InputField id="age" label="Age" placeholder="e.g., 6 or Adult" />
          </div>
          <TextareaField
            id="goals"
            label="What are you looking for?"
            placeholder="E.g., speech therapy for articulation, feeding therapy, literacy support, etc. Include any scheduling or cultural preferences."
          />
        </div>
      )}

      {role === "slp" && (
        <div className="mt-6 grid gap-6 rounded-xl bg-neutral-50 p-6">
          <h3 className="font-heading text-base font-medium text-neutral-800">
            Provider Information
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField
              id="state"
              label="Licensed State(s)"
              placeholder="e.g., NY, NJ, CA"
            />
            <InputField
              id="availability"
              label="Preferred Schedule"
              placeholder="e.g., weekdays 4–7pm, weekends"
            />
          </div>
          <TextareaField
            id="expertise"
            label="Your Expertise & Interests"
            placeholder="Tell us about your specialties (e.g., pediatric language, AAC, fluency, feeding), populations you prefer, and if you're interested in remote or in-person work."
          />
        </div>
      )}

      {role === "ot" && (
        <div className="mt-6 grid gap-6 rounded-xl bg-neutral-50 p-6">
          <h3 className="font-heading text-base font-medium text-neutral-800">
            Occupational Therapist Information
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField
              id="state"
              label="Licensed State(s)"
              placeholder="e.g., NY, NJ, CA"
            />
            <InputField
              id="availability"
              label="Preferred Schedule"
              placeholder="e.g., weekdays 4–7pm, weekends"
            />
          </div>
          <TextareaField
            id="expertise"
            label="Your Expertise & Interests"
            placeholder="Tell us about your specialties (e.g., pediatric OT, sensory integration, fine motor, feeding), populations you prefer, and if you're interested in remote or in-person work."
          />
        </div>
      )}

      {role === "pt" && (
        <div className="mt-6 grid gap-6 rounded-xl bg-neutral-50 p-6">
          <h3 className="font-heading text-base font-medium text-neutral-800">
            Physical Therapist Information
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField
              id="state"
              label="Licensed State(s)"
              placeholder="e.g., NY, NJ, CA"
            />
            <InputField
              id="availability"
              label="Preferred Schedule"
              placeholder="e.g., weekdays 4–7pm, weekends"
            />
          </div>
          <TextareaField
            id="expertise"
            label="Your Expertise & Interests"
            placeholder="Tell us about your specialties (e.g., pediatric PT, orthopedics, neurological, sports therapy), populations you prefer, and if you're interested in remote or in-person work."
          />
        </div>
      )}

      {role === "ota" && (
        <div className="mt-6 grid gap-6 rounded-xl bg-neutral-50 p-6">
          <h3 className="font-heading text-base font-medium text-neutral-800">
            Occupational Therapist Assistant Information
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField
              id="state"
              label="Licensed State(s)"
              placeholder="e.g., NY, NJ, CA"
            />
            <InputField
              id="availability"
              label="Preferred Schedule"
              placeholder="e.g., weekdays 4–7pm, weekends"
            />
          </div>
          <TextareaField
            id="expertise"
            label="Your Experience & Interests"
            placeholder="Tell us about your experience (e.g., pediatric OT, sensory integration, fine motor, feeding), populations you prefer, and if you're interested in remote or in-person work."
          />
        </div>
      )}

      {role === "pta" && (
        <div className="mt-6 grid gap-6 rounded-xl bg-neutral-50 p-6">
          <h3 className="font-heading text-base font-medium text-neutral-800">
            Physical Therapist Assistant Information
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField
              id="state"
              label="Licensed State(s)"
              placeholder="e.g., NY, NJ, CA"
            />
            <InputField
              id="availability"
              label="Preferred Schedule"
              placeholder="e.g., weekdays 4–7pm, weekends"
            />
          </div>
          <TextareaField
            id="expertise"
            label="Your Experience & Interests"
            placeholder="Tell us about your experience (e.g., pediatric PT, orthopedics, neurological, sports therapy), populations you prefer, and if you're interested in remote or in-person work."
          />
        </div>
      )}

      {role === "school" && (
        <div className="mt-6 grid gap-6 rounded-xl bg-neutral-50 p-6">
          <h3 className="font-heading text-base font-medium text-neutral-800">
            School / Organization Needs
          </h3>
          <InputField
            id="orgName"
            label="School/Organization Name"
            placeholder="Your school or organization"
          />
          <TextareaField
            id="need"
            label="What support do you need?"
            placeholder="E.g., temporary coverage, ongoing SEIT services, school-based therapy, evaluations, group sessions, etc."
          />
        </div>
      )}

      <TextareaField
        id="message"
        label="Additional Information"
        placeholder="Any questions, cultural preferences, language needs, location details, or other relevant information"
        className="mt-6"
      />

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="font-body text-sm text-green-800">
            ✅ Thank you! Your message has been sent successfully. We&apos;ll be in touch within 1-2 business days.
          </p>
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="font-body text-sm text-red-800">
            ❌ Sorry, there was an error sending your message. Please try again or contact us directly.
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="font-body text-xs text-neutral-500">
          We respect your privacy and will only use your information to connect you with our services.
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-500 px-6 py-4 text-base font-semibold hover:bg-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Get Connected'}
        </Button>
      </div>
    </form>
  </div>
</section>


      <SiteFooter />
    </div>
  );
}

/* ─────────── UI bits (kept super simple; no extra card/border noise) ─────────── */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-50/80 via-blue-50/80 to-indigo-50/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <a href="#home" className="group flex items-center gap-2">
            <Image 
              src="/beyond speech logo.png" 
              alt="Beyond Speech" 
              width={32} 
              height={32} 
              className="h-8 w-8 object-contain"
            />
            <span className="font-heading text-xl font-bold text-blue-600">Beyond Speech</span>
          </a>
          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              <li><a href="#families" className="font-body text-sm font-medium text-neutral-700 hover:text-brand hover:scale-110 transition-transform">Clients</a></li>
              <li><a href="#slps" className="font-body text-sm font-medium text-neutral-700 hover:text-accent hover:scale-110 transition-transform">Providers</a></li>

              <li><a href="#services" className="font-body text-sm font-medium text-neutral-700 hover:text-success hover:scale-110 transition-transform">Services</a></li>
              <li><a href="#contact" className="font-body text-sm font-medium text-neutral-700 hover:text-info hover:scale-110 transition-transform">Contact</a></li>
             <a href="#og-camp" className="font-body text-sm font-medium text-neutral-700 hover:text-sunny hover:scale-110 transition-transform">Programs</a>
            </ul>
          </nav>
          <div className="hidden md:block">
            <a href="#contact">
              <Button className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold hover:bg-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all">Get Started</Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}



/* Smaller atoms */
function Step({
  n,
  title,
  desc,
  color = "brand",
}: {
  n: number;
  title: string;
  desc: string;
  color?: "brand" | "accent" | "success" | "info";
}) {
  const bg =
    color === "accent"
      ? "bg-accent"
      : color === "success"
      ? "bg-success"
      : color === "info"
      ? "bg-info"
      : "bg-brand";

  return (
    <li className="text-center">
      <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${bg} text-white text-base font-bold shadow-lg hover:scale-110 transition-transform`}>
        {n}
      </div>
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      <p className="font-body mt-2 text-sm text-neutral-600">{desc}</p>
    </li>
  );
}





function InputField({
  id,
  label,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-body text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        className="rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </div>
  );
}

function TextareaField({
  id,
  label,
  placeholder,
  className = "",
}: {
  id: string;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`grid gap-1 ${className}`}>
      <label htmlFor={id} className="font-body text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        placeholder={placeholder}
        className="min-h-[100px] rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </div>
  );
}
/* --- Accurate Services (drop this where you want your Services section) --- */
/* --- Accurate Services (drop this where you want your Services section) --- */



/* small helper that matches your minimal style */


