"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from 'next/navigation'

export default function Home() {
  const [expandedFAQ, setExpandedFAQ] = useState(0);
  const [billingType, setBillingType] = useState('personal');
  const router = useRouter()

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? -1 : index);
  };

  const toggleBilling = (type: string) => {
    setBillingType(type);
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="bg-white border-b border-gray-100 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/pogoLogo.png"
              alt="HelloPogo Logo"
              width={177}
              height={62}
              className="flex-shrink-0"
              style={{
                width: '177px',
                height: '62px',
                flexShrink: 0,
                aspectRatio: '177/62'
              }}
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              style={{
                color: '#242426',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              style={{
                color: '#242426',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              How it works
            </a>
            <a
              href="#pricing"
              style={{
                color: '#242426',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              Pricing
            </a>
            <div className="flex items-center space-x-1 cursor-pointer">
              <span
                style={{
                  color: '#242426',
                  textAlign: 'center',
                  fontFamily: 'Inter',
                  fontSize: '16px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: 'normal'
                }}
              >
                Resources
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-gray-700 border border-blue-300 rounded-lg hover:bg-gray-50"
            >
              Log in
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-3 text-white rounded-lg font-semibold"
              style={{
                backgroundColor: '#00AAF8'
              }}
            >
              Start free trial
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Overlapping Product Preview */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/hero_bg.svg"
            alt="Hero Background"
            fill
            className="object-cover"
            style={{ pointerEvents: 'none' }}
          />
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1
            className="mb-6"
            style={{
              color: '#151515',
              textAlign: 'center',
              fontFamily: 'Inter',
              fontSize: '60px',
              fontStyle: 'normal',
              fontWeight: 500,
              lineHeight: '77px'
            }}
          >
            Keep Your Product<br />
            Documentation Always Up-<br />
            to-Date with AI
          </h1>
          <p
            className="mb-8 max-w-3xl mx-auto"
            style={{
              color: '#5F5F64',
              textAlign: 'center',
              fontFamily: 'Inter',
              fontSize: '18px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: '26px'
            }}
          >
            Capture, convert, and deploy documentation in minutes—not days. Automatically sync your UI changes with your help docs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-3 text-white rounded-lg font-semibold"
              style={{
                backgroundColor: '#00AAF8'
              }}
            >
              Start free trial
            </button>
            <button
              className="px-8 py-3 text-black font-semibold flex items-center justify-center space-x-2"
              style={{
                borderRadius: '8px',
                border: '1px solid #00AAF8',
                background: '#FFF'
              }}
            >
              <Image
                src="/install.svg"
                alt="Install Icon"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span>Install Chrome Extension</span>
            </button>
          </div>
        </div>

        {/* Product Preview Overlapping */}
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-4xl mx-auto transform translate-y-16">
            <Image
              src="/ipaid.png"
              alt="HelloPogo Dashboard Interface"
              width={1200}
              height={800}
              className="w-full h-auto rounded-2xl shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Trusted Companies Section - Overlapping the Product Preview */}
      <section className="bg-white relative -mt-64 pt-20 pb-26 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2
            className="mb-12"
            style={{
              color: '#151515',
              textAlign: 'center',
              fontFamily: 'Inter',
              fontSize: '18px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'normal'
            }}
          >
            Trusted by 1500+ companies
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-16">
            <div className="flex items-center space-x-2">
              <Image
                src="/y.png"
                alt="Y Combinator"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Image
                src="/m.png"
                alt="Multicoin Capital"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Image
                src="/b.png"
                alt="Borderless"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Badge - Separate */}
      <div className="bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div
              className="mb-32 -mt-12"
              style={{
                display: 'flex',
                padding: '6px 12px',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '100px',
                border: '1px solid #00AAF8',
                background: 'rgba(204, 238, 254, 0.80)',
                width: '120px',
                margin: '0 auto'
              }}
            >
              <span className="text-black text-sm font-medium">Problem</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <section className="bg-white pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 mt-16">
            <h2
              className="mb-4"
              style={{
                color: '#151515',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '42px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              The Documentation Dilemma
            </h2>
            <p
              style={{
                color: '#5F5F64',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '26px'
              }}
            >
              Your product evolves constantly, but your documentation can&apos;t keep up
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Layered Image Effect - Rectangle Shadow + Person */}
            <div className="relative w-4/5 mx-auto">
              {/* Rectangle Shadow Layer */}
              <div className="absolute inset-0 transform translate-x-6 translate-y-6 opacity-30">
                <Image
                  src="/Rectangle 157.png"
                  alt="Shadow Rectangle"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                />
              </div>

              {/* Person with Laptop - Main Layer */}
              <div className="relative z-10">
                <Image
                  src="/frustrated-person-laptop.png"
                  alt="Frustrated person looking at laptop"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>

            {/* Text Content */}
            <div>
              <h3
                className="mb-6"
                style={{
                  color: '#242426',
                  fontFamily: 'Inter',
                  fontSize: '22px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: 'normal'
                }}
              >
                Outdated Documentation Hurts Everyone
              </h3>
              <div className="space-y-4">
                <p
                  style={{
                    color: '#242426',
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: '23px'
                  }}
                >
                  As your product Interface evolves with new features and Improvements, your documentation becomes obsolete almost Immediately. Screenshots no longer match, instructions become confusing, and your support team struggles to bridge the gap.
                </p>
                <p
                  style={{
                    color: '#242426',
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: '23px'
                  }}
                >
                  The result? Frustrated customers, Increased support tickets, and wasted resources trying to keep documentation current.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section
        className="py-20 px-6"
        style={{
          background: '#001119'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-block px-4 py-1 mb-6"
              style={{
                borderRadius: '100px',
                border: '1px solid #00AAF8',
                background: 'rgba(204, 238, 254, 0.80)'
              }}
            >
              <span className="text-black text-sm font-medium">Solution</span>
            </div>
            <h2
              className="mb-4"
              style={{
                color: '#FFF',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '42px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              Documentation That Evolves with Your Product
            </h2>
            <p
              style={{
                color: '#C0C0C0',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '26px'
              }}
            >
              Our three-part solution creates and maintains perfect documentation with minimal effort
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="relative">
              {/* Blue line for Capture section */}
              <div className="absolute left-0 top-0 h-40 w-1 bg-blue-500"></div>
              {/* White line for Convert and Deploy sections */}
              <div className="absolute left-0 top-40 bottom-0 w-1 bg-white"></div>
              <div className="pl-8 space-y-12">
                <div className="relative">
                  {/* Timeline marker for Capture */}
                  <div className="absolute -left-8 top-3 w-6 h-px bg-blue-500"></div>
                  <h3
                    className="mb-4"
                    style={{
                      color: '#FFF',
                      fontFamily: 'Inter',
                      fontSize: '24px',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      lineHeight: 'normal'
                    }}
                  >
                    Capture
                  </h3>
                  <p
                    className="mb-4"
                    style={{
                      color: '#E9E9E9',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '22px'
                    }}
                  >
                    Our Chrome extension lets you record your screen while adding audio descriptions. Take full or partial screenshots as you demonstrate features—no video editing required.
                  </p>
                  <a
                    href="#"
                    className="flex items-center space-x-1"
                    style={{
                      color: '#FFF',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      lineHeight: 'normal'
                    }}
                  >
                    <span>Read more</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>

                <div className="relative">
                  {/* Timeline marker for Convert */}
                  <div className="absolute -left-8 top-3 w-6 h-px bg-white"></div>
                  <h3
                    className="mb-4"
                    style={{
                      color: '#494949',
                      fontFamily: 'Inter',
                      fontSize: '24px',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      lineHeight: 'normal'
                    }}
                  >
                    Convert
                  </h3>
                  <p
                    className="mb-4"
                    style={{
                      color: '#494949',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '22px'
                    }}
                  >
                    Our AI system processes your captures, transforming them into professional documentation. Images are analyzed, audio is transcribed, and comprehensive help docs are automatically generated.
                  </p>
                  <a
                    href="#"
                    className="flex items-center space-x-1"
                    style={{
                      color: '#494949',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      lineHeight: 'normal'
                    }}
                  >
                    <span>Read more</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>

                <div className="relative">
                  {/* Timeline marker for Deploy */}
                  <div className="absolute -left-8 top-3 w-6 h-px bg-white"></div>
                  <h3
                    className="mb-4"
                    style={{
                      color: '#494949',
                      fontFamily: 'Inter',
                      fontSize: '24px',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      lineHeight: 'normal'
                    }}
                  >
                    Deploy
                  </h3>
                  <p
                    className="mb-4"
                    style={{
                      color: '#494949',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '22px'
                    }}
                  >
                    Publish your documentation instantly and embed our AI chatbot on your site. Your customers get 24/7 support that&apos;s always up-to-date with your latest product changes.
                  </p>
                  <a
                    href="#"
                    className="flex items-center space-x-1"
                    style={{
                      color: '#494949',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      lineHeight: 'normal'
                    }}
                  >
                    <span>Read more</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Solution Image */}
            <div className="w-4/5 mx-auto">
              <Image
                src="/laptop.png"
                alt="Person working on laptop with headphones"
                width={600}
                height={400}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-block px-4 py-1 mb-6"
              style={{
                borderRadius: '100px',
                border: '1px solid #00AAF8',
                background: 'rgba(204, 238, 254, 0.80)'
              }}
            >
              <span className="text-black text-sm font-medium">Benefits</span>
            </div>
            <h2
              className="mb-4"
              style={{
                color: '#151515',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '42px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              Why Choose HelloPogo?
            </h2>
            <p
              style={{
                color: '#5F5F64',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '26px'
              }}
            >
              Transform your documentation process and improve customer experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src="/Frame.svg"
                  alt="Frame Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <h3
                className="mb-3"
                style={{
                  color: '#151515',
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: 'normal'
                }}
              >
                Always Current Documentation
              </h3>
              <p className="text-gray-600">Documentation that updates as quickly as your product interface changes, ensuring accuracy at all times.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src="/Frame 2.svg"
                  alt="Frame 2 Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <h3
                className="mb-3"
                style={{
                  color: '#151515',
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: 'normal'
                }}
              >
                24/7 AI-Powered Support
              </h3>
              <p className="text-gray-600">Help your customers find answers instantly with a chatbot trained on your latest documentation.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src="/Frame 3.svg"
                  alt="Frame 3 Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <h3
                className="mb-3"
                style={{
                  color: '#151515',
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: 'normal'
                }}
              >
                Reduced Technical Writing Costs
              </h3>
              <p className="text-gray-600">Eliminate the need for dedicated technical writers and lengthy documentation updates.</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src="/Frame 4.svg"
                  alt="Frame 4 Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <h3
                className="mb-3"
                style={{
                  color: '#151515',
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: 'normal'
                }}
              >
                Improved User Adoption
              </h3>
              <p className="text-gray-600">Clear, accurate documentation helps users master your product faster and more effectively.</p>
            </div>

            {/* Card 5 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src="/Frame 5.svg"
                  alt="Frame 5 Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <h3
                className="mb-3"
                style={{
                  color: '#151515',
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: 'normal'
                }}
              >
                Multiple Project Management
              </h3>
              <p className="text-gray-600">Handle documentation for multiple products or projects from a single dashboard.</p>
            </div>

            {/* Card 6 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src="/Frame 4.svg"
                  alt="Frame 4 Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <h3
                className="mb-3"
                style={{
                  color: '#151515',
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: 'normal'
                }}
              >
                Support Team Relief
              </h3>
              <p className="text-gray-600">Reduce the volume of basic support requests by 70% with self-service documentation and AI assistance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-20 px-6"
        style={{
          background: '#001119'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-block px-4 py-1 mb-6"
              style={{
                borderRadius: '100px',
                border: '1px solid #00AAF8',
                background: 'rgba(204, 238, 254, 0.80)'
              }}
            >
              <span className="text-black text-sm font-medium">Process</span>
            </div>
            <h2
              className="mb-4"
              style={{
                color: '#FFF',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '42px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              How HelloPogo Works
            </h2>
            <p
              style={{
                color: '#C0C0C0',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '26px'
              }}
            >
              A simple process that transforms how you create and maintain documentation.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Horizontal Timeline */}
            <div className="relative">
              {/* Steps Container */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="mb-4">
                    <Image
                      src="/one.png"
                      alt="Step 1"
                      width={295}
                      height={44}
                      className="w-[295px] h-[44px] mx-auto"
                    />
                  </div>
                  <h3
                    className="mb-3"
                    style={{
                      color: '#FFF',
                      fontFamily: 'Inter',
                      fontSize: '20px',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      lineHeight: 'normal'
                    }}
                  >
                    Install Chrome Extension
                  </h3>
                  <p
                    style={{
                      color: '#E5E5E5',
                      fontFamily: 'Mona-Sans',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '22px'
                    }}
                  >
                    Download our Chrome extension from the Chrome Web Store and set up your AskPogo account.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="mb-4">
                    <Image
                      src="/2.png"
                      alt="Step 2"
                      width={295}
                      height={44}
                      className="w-[295px] h-[44px] mx-auto"
                    />
                  </div>
                  <h3
                    className="mb-3"
                    style={{
                      color: '#FFF',
                      fontFamily: 'Inter',
                      fontSize: '20px',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      lineHeight: 'normal'
                    }}
                  >
                    Record Your Processes
                  </h3>
                  <p
                    style={{
                      color: '#E5E5E5',
                      fontFamily: 'Mona-Sans',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '22px'
                    }}
                  >
                    Capture screenshots and record audio descriptions as you navigate through your product.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="mb-4">
                    <Image
                      src="/3.png"
                      alt="Step 3"
                      width={295}
                      height={44}
                      className="w-[295px] h-[44px] mx-auto"
                    />
                  </div>
                  <h3
                    className="mb-3"
                    style={{
                      color: '#FFF',
                      fontFamily: 'Inter',
                      fontSize: '20px',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      lineHeight: 'normal'
                    }}
                  >
                    AI Generates Documentation
                  </h3>
                  <p
                    style={{
                      color: '#E5E5E5',
                      fontFamily: 'Mona-Sans',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '22px'
                    }}
                  >
                    Our AI processes your captures and creates comprehensive, structured documentation.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="text-center">
                  <div className="mb-4">
                    <Image
                      src="/4.png"
                      alt="Step 4"
                      width={295}
                      height={44}
                      className="w-[295px] h-[44px] mx-auto"
                    />
                  </div>
                  <h3
                    className="mb-3"
                    style={{
                      color: '#FFF',
                      fontFamily: 'Inter',
                      fontSize: '20px',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      lineHeight: 'normal'
                    }}
                  >
                    Review and Publish
                  </h3>
                  <p
                    style={{
                      color: '#E5E5E5',
                      fontFamily: 'Mona-Sans',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '22px'
                    }}
                  >
                    Make any final edits in our web dashboard, then publish to your help center and deploy the chatbot.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-block px-4 py-1 mb-6"
              style={{
                borderRadius: '100px',
                border: '1px solid #00AAF8',
                background: 'rgba(204, 238, 254, 0.80)'
              }}
            >
              <span className="text-black text-sm font-medium">Pricing</span>
            </div>
            <h2
              className="mb-4"
              style={{
                color: '#151515',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '42px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              Simple, Transparent Pricing
            </h2>
            <p
              style={{
                color: '#5F5F64',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '26px'
              }}
            >
              Choose the plan that&apos;s right for your business needs
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="relative bg-white border border-gray-200 rounded-full p-1 flex w-56">
              <button
                onClick={() => toggleBilling('personal')}
                className={`px-4 py-2 rounded-full font-medium flex-1 transition-all duration-300 text-sm ${billingType === 'personal'
                  ? 'text-white'
                  : 'text-gray-600'
                  }`}
                style={{
                  borderRadius: billingType === 'personal' ? '20px' : '20px',
                  background: billingType === 'personal' ? '#00AAF8' : 'transparent',
                  display: 'flex',
                  padding: '10px 15px',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                Personal
              </button>
              <button
                onClick={() => toggleBilling('business')}
                className={`px-4 py-2 rounded-full font-medium flex-1 transition-all duration-300 text-sm ${billingType === 'business'
                  ? 'text-white'
                  : 'text-gray-600'
                  }`}
                style={{
                  borderRadius: billingType === 'business' ? '20px' : '20px',
                  background: billingType === 'business' ? '#00AAF8' : 'transparent',
                  display: 'flex',
                  padding: '10px 15px',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                Business
              </button>
            </div>
          </div>
          <div className="flex justify-center mb-12">
            <p
              style={{
                fontFamily: 'Inter',
                fontWeight: 600,
                fontStyle: 'normal',
                fontSize: '14px',
                lineHeight: '100%',
                letterSpacing: '0%',
                textAlign: 'center',
                background: 'white',
                color: '#00AAF8',
                padding: '8px 16px',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Save 20% with annual billing
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Plan */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h3
                className="mb-2"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontStyle: 'normal',
                  fontSize: '24px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#151515'
                }}
              >
                Standard
              </h3>
              <p
                className="mb-6"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#7C7C80'
                }}
              >
                Perfect for small teams
              </p>
              <div className="mb-6">
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontStyle: 'normal',
                    fontSize: '38px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#151515'
                  }}
                >
                  $19.99
                </span>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#7C7C80'
                  }}
                >
                  /month
                </span>
              </div>
              <p
                className="mb-6"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#7C7C80'
                }}
              >
                14-day trial, no credit card required
              </p>
              <button
                className="w-full text-white py-3 rounded-lg font-semibold mb-8"
                style={{
                  background: '#00AAF8'
                }}
              >
                Start free trial
              </button>
              <div>
                <h4
                  className="mb-4"
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#151515'
                  }}
                >
                  Standard features:
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      Unlimited documentation sessions
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      1 project included
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      AI-powered chat widget
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      50GB storage
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      Basic analytics
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      Email support
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h3
                className="mb-2"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontStyle: 'normal',
                  fontSize: '24px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#151515'
                }}
              >
                Pro
              </h3>
              <p
                className="mb-6"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#7C7C80'
                }}
              >
                For growing teams
              </p>
              <div className="mb-6">
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontStyle: 'normal',
                    fontSize: '38px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#151515'
                  }}
                >
                  $39.99
                </span>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#7C7C80'
                  }}
                >
                  /month
                </span>
              </div>
              <p
                className="mb-6"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#7C7C80'
                }}
              >
                14-day trial, no credit card required
              </p>
              <button
                className="w-full text-white py-3 rounded-lg font-semibold mb-8"
                style={{
                  background: '#00AAF8'
                }}
              >
                Start free trial
              </button>
              <div>
                <h4
                  className="mb-4"
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#151515'
                  }}
                >
                  Everything in Standard. Plus:
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      Up to 5 projects included
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      Advance widget customization
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      200GB storage
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      Advance analytics
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-800 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#7C7C80'
                      }}
                    >
                      Priority email & chat support
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Side - Heading */}
            <div>
              <h2
                className="font-inter font-semibold leading-tight"
                style={{
                  color: '#00AAF8',
                  fontFamily: 'Inter',
                  fontSize: '42px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: '56px',
                  letterSpacing: '0.84px',
                  width: '295px'
                }}
              >
                Frequently<br />
                Asked<br />
                Question
              </h2>
            </div>

            {/* Right Side - FAQ Items */}
            <div
              className="space-y-6"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '40px'
              }}
            >
              {/* FAQ Item 1 */}
              <div className="border-b border-gray-200 pb-6 w-full">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleFAQ(0)}>
                  <h3
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontStyle: 'normal',
                      fontSize: '24px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: '#151515'
                    }}
                  >
                    What happens after my free trial?
                  </h3>
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {expandedFAQ === 0 ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                </div>
                {expandedFAQ === 0 && (
                  <p
                    className="mt-4"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '22px',
                      letterSpacing: '0%',
                      color: '#242426'
                    }}
                  >
                    After your 30-day free trial, your account will automatically switch to our pay-as-you-go plan based on your usage. You can upgrade, downgrade, or cancel at any time.
                  </p>
                )}
              </div>

              {/* FAQ Item 2 */}
              <div className="border-b border-gray-200 pb-6 w-full">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleFAQ(1)}>
                  <h3
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontStyle: 'normal',
                      fontSize: '24px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: '#151515'
                    }}
                  >
                    Can I change plans later?
                  </h3>
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {expandedFAQ === 1 ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                </div>
                {expandedFAQ === 1 && (
                  <p
                    className="mt-4"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '22px',
                      letterSpacing: '0%',
                      color: '#242426'
                    }}
                  >
                    Yes, you can change your plan at any time. Simply go to your account settings and select the plan that best fits your needs. Changes take effect immediately.
                  </p>
                )}
              </div>

              {/* FAQ Item 3 */}
              <div className="border-b border-gray-200 pb-6 w-full">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleFAQ(2)}>
                  <h3
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontStyle: 'normal',
                      fontSize: '24px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: '#151515'
                    }}
                  >
                    What payment methods do you accept?
                  </h3>
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {expandedFAQ === 2 ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                </div>
                {expandedFAQ === 2 && (
                  <p
                    className="mt-4"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '22px',
                      letterSpacing: '0%',
                      color: '#242426'
                    }}
                  >
                    We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe.
                  </p>
                )}
              </div>

              {/* FAQ Item 4 */}
              <div className="border-b border-gray-200 pb-6 w-full">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleFAQ(3)}>
                  <h3
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontStyle: 'normal',
                      fontSize: '24px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: '#151515'
                    }}
                  >
                    Do you offer discounts for non-profits or educational institutions?
                  </h3>
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {expandedFAQ === 3 ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                </div>
                {expandedFAQ === 3 && (
                  <p
                    className="mt-4"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '22px',
                      letterSpacing: '0%',
                      color: '#242426'
                    }}
                  >
                    Yes, we offer special pricing for non-profit organizations and educational institutions. Please contact our sales team with your organization details to learn more about our discount programs.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-black py-20 px-6 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/star_bg.png"
            alt="Star background"
            fill
            className="object-cover opacity-40"
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2
            className="mb-6"
            style={{
              fontFamily: 'Inter',
              fontWeight: 600,
              fontStyle: 'normal',
              fontSize: '42px',
              lineHeight: '56px',
              letterSpacing: '2%',
              color: 'white',
              whiteSpace: 'nowrap'
            }}
          >
            Transform Your Documentation Process Today
          </h2>
          <p
            className="mb-8"
            style={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontStyle: 'normal',
              fontSize: '18px',
              lineHeight: '25px',
              letterSpacing: '0%',
              textAlign: 'center',
              color: '#E5E5E5'
            }}
          >
            Join forward-thinking companies that are revolutionizing their documentation and support experience.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              style={{
                width: '154px',
                height: '42px',
                borderRadius: '8px',
                paddingTop: '15px',
                paddingRight: '23px',
                paddingBottom: '15px',
                paddingLeft: '24px',
                gap: '10px',
                opacity: 1,
                color: 'white',
                background: '#00AAF8',
                border: 'none',
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              Start free trial
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Side - Heading */}
            <div>
              <h2
                className="mb-4"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontStyle: 'normal',
                  fontSize: '42px',
                  lineHeight: '56px',
                  letterSpacing: '2%',
                  color: '#151515'
                }}
              >
                Get in Touch
              </h2>
              <p
                style={{
                  color: '#5F5F64',
                  textAlign: 'left',
                  fontFamily: 'Inter',
                  fontSize: '18px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '26px'
                }}
              >
                Ready to transform your documentation process? Let&apos;s talk.
              </p>
            </div>

            {/* Right Side - Contact Form */}
            <div className="p-8">
              <form className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0px',
                      color: '#151515'
                    }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0px',
                      color: '#151515'
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block mb-2"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0px',
                      color: '#151515'
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about your project..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="text-white font-semibold ml-auto"
                  style={{
                    display: 'flex',
                    padding: '15px 40px',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    borderRadius: '8px',
                    background: '#00AAF8'
                  }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="text-white py-16 px-6"
        style={{
          background: '#222529'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <Image
                  src="/pogoLogo.png"
                  alt="HelloPogo Logo"
                  width={177}
                  height={62}
                  className="flex-shrink-0"
                  style={{
                    width: '177px',
                    height: '62px',
                    flexShrink: 0,
                    aspectRatio: '177/62'
                  }}
                />
              </div>
              <p
                className="mb-4"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '22px',
                  letterSpacing: '0%',
                  color: '#8E8E93'
                }}
              >
                HelloPogo is an AI-powered solution that revolutionizes product documentation and customer support. Keep your documentation always up-to-date with minimal effort.
              </p>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '22px',
                    letterSpacing: '2%',
                    color: '#8E8E93'
                  }}
                >
                  Support@hellopogo.in
                </span>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3
                className="mb-4"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontStyle: 'normal',
                  fontSize: '20px',
                  lineHeight: '100%',
                  letterSpacing: '2%',
                  color: '#8E8E93'
                }}
              >
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Chrome Extension
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Chat Widget
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3
                className="mb-4"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontStyle: 'normal',
                  fontSize: '20px',
                  lineHeight: '100%',
                  letterSpacing: '2%',
                  color: '#8E8E93'
                }}
              >
                Company
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    About us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3
                className="mb-4"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontStyle: 'normal',
                  fontSize: '20px',
                  lineHeight: '100%',
                  letterSpacing: '2%',
                  color: '#8E8E93'
                }}
              >
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '2%',
                      color: '#8E8E93'
                    }}
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p
              className="mb-4 md:mb-0"
              style={{
                fontFamily: 'Inter',
                fontWeight: 500,
                fontStyle: 'normal',
                fontSize: '16px',
                lineHeight: '23px',
                letterSpacing: '2%',
                color: '#8E8E93'
              }}
            >
              2025 Hellopogo. All rights reserved
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
