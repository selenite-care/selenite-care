"use client";

import "react-phone-number-input/style.css";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { FAQS } from "@/lib/faq";

export const dynamic = "force-dynamic";

const CONTENT = {
  en: {
    header: {
      tagline: "Skincare Consultation",
      callButton: "Call Now",
      joinButton: "Get Membership",
      joinButtonMobile: "Join",
    },
    hero: {
      badge: "PROFESSIONAL SKINCARE CONSULTATION",
      heading: "Expert Skincare Guidance, Tailored For You",
      subtext:
        "Certified aestheticians who analyze your skin and create your personalized care plan.",
      primaryButton: "Get Membership Now",
      secondaryButton: "Call Us Now",
      trustBadges: [
        "Certified Aestheticians",
        "Personalized Skin Plan",
        "Online & Offline Support",
        "Expert Guidance",
      ],
    },
    about: {
      label: "ABOUT US",
      heading: "What is Selenite Care?",
      body:
        "Selenite Care is a professional skincare consultation platform connecting you with certified aestheticians and skin specialists. We provide personalized skin analysis, customized routines, and expert product recommendations to help you achieve your best skin.",
      bullets: [
        "Certified Skin Specialists",
        "Personalized Care Plans",
        "Online & Offline Consultations",
        "Ongoing Support & Guidance",
      ],
      stats: [
        { number: "500+", label: "Happy Clients" },
        { number: "3", label: "Membership Plans" },
        { number: "100%", label: "Personalized" },
        { number: "24/7", label: "Online Support" },
      ],
    },
    membership: {
      heading: "Our Membership Plans",
      subtext: "Choose the plan that fits your skin transformation goals.",
      signature: {
        title: "Signature",
        duration: "2 Months",
        price: "490 BDT",
        original: "990 BDT",
        badge: "51% OFF",
        benefits: [
          "60 Days Skincare Support",
          "Skin, Body & Hair Analysis",
          "Expert Consultation",
          "Personalized Routine",
        ],
        button: "Get Signature Membership",
        link: "/membership/payment?tier=SIGNATURE",
      },
      crystal: {
        title: "Crystal",
        duration: "12 Months",
        price: "3,990 BDT",
        benefits: [
          "1 Year Specialist Support",
          "Aesthetician, Nutritionist & Psychiatrist",
          "Advanced Skin Assessment",
          "Customized Care Plan",
        ],
        button: "Coming Soon",
        disabled: true,
      },
      platinum: {
        title: "Platinum",
        duration: "36 Months",
        price: "9,990 BDT",
        badge: "PREMIUM",
        benefits: [
          "3 Years Specialist Support",
          "5% Off Product Purchases",
          "Advanced Skin Mapping",
          "Progress Monitoring",
        ],
        button: "Coming Soon",
        disabled: true,
      },
    },
    howItWorks: {
      heading: "How It Works",
      steps: [
        {
          n: "01",
          title: "Register",
          desc: "Create your free account on our website.",
        },
        {
          n: "02",
          title: "Choose Membership",
          desc: "Select the plan that fits your skin goals.",
        },
        {
          n: "03",
          title: "Book Consultation",
          desc: "Choose your doctor and preferred date.",
        },
        {
          n: "04",
          title: "Transform Your Skin",
          desc: "Follow your personalized plan and see results.",
        },
      ],
    },
    video: {
      heading: "See How We Work",
      subtext:
        "Watch how our expert team conducts skin consultations and transforms lives.",
    },
    doctors: {
      heading: "Meet Our Expert Team",
      subtext: "Certified specialists dedicated to your skin health.",
    },
    // PLACEHOLDER - REPLACE WITH REAL CONTENT
    testimonials: {
      heading: "What Our Clients Say",
      items: [
        {
          name: "Nusrat J.",
          concern: "Acne & Pigmentation",
          text: "Selenite Care completely transformed my skin. After just 2 months of following my personalized routine, my acne scars have faded significantly!",
        },
        {
          name: "Rabeya K.",
          concern: "Dry & Sensitive Skin",
          text: "I finally found a solution for my sensitive skin. The personalized recommendations were spot on and my skin has never felt better.",
        },
        {
          name: "Fatema A.",
          concern: "Oily Skin",
          text: "The consultation was thorough and the product recommendations were perfect for my skin type. Highly recommend to everyone!",
        },
      ],
    },
    faq: {
      heading: "Common Questions",
    },
    leadCapture: {
      label: "INTERESTED?",
      heading: "Let Us Call You",
      subtext:
        "Leave your details and our team will reach out within 24 hours to help you choose the right plan.",
      namePlaceholder: "Your Full Name",
      phonePlaceholder: "Your Phone Number",
      phoneNote: "We will call or WhatsApp this number",
      emailPlaceholder: "Email Address (optional)",
      interestLabel: "Which plan interests you?",
      interestOptions: [
        "Not Sure Yet",
        "Signature Membership",
        "Crystal Membership",
        "Platinum Membership",
      ],
      buttonText: "Send My Details",
      successMessage:
        "Thank you! Our team will contact you within 24 hours. \u{1F31F}",
      errorMessage:
        "Something went wrong. Please try again or call us directly.",
    },
    registration: {
      label: "REGISTER",
      heading: "Create Your Account",
      subtext:
        "Sign up here to book consultations, manage appointments, and continue your skincare journey without leaving this page.",
      openButton: "Register Now",
      modalTitle: "Join Selenite Care",
      modalSubtext:
        "Create your account to book appointments and manage your care.",
      nameLabel: "Name",
      phoneLabel: "Phone",
      emailLabel: "Email",
      dobLabel: "Date of Birth",
      passwordLabel: "Password",
      submitButton: "Create account",
      submittingButton: "Creating account...",
      successTitle: "Verify Your Email",
      successPrefix: "We've sent a verification link to",
      successSuffix:
        ". Please check your inbox and activate your account before logging in.",
      resendButton: "Resend Verification Email",
      resendSending: "Sending...",
      resendSuccess:
        "Verification email sent again. Please check your inbox.",
      existingAccount:
        "An account with this email already exists. If you registered recently but haven't verified your email yet, please check your inbox for the verification link. You can also request a new verification email from the login page.",
      loginPrompt: "Already a user?",
      loginLink: "Login here.",
      closeButton: "Close",
      phoneError: "Please enter a valid phone number.",
      fallbackError: "Registration failed. Please try again.",
    },
    contact: {
      heading: "Contact Us",
      card1Label: "Call Us",
      card2Label: "WhatsApp",
      card3Label: "Facebook",
      bigButton:  "Call Our Office Now",
    },
    footer: {
      copyright: "\u00A9 2026 Selenite Care. All rights reserved.",
    },
  },
  bn: {
    header: {
      tagline:
        "\u09b8\u09cd\u0995\u09bf\u09a8\u0995\u09c7\u09df\u09be\u09b0 \u0995\u09a8\u09b8\u09be\u09b2\u099f\u09c7\u09b6\u09a8",
      callButton: "\u0995\u09b2 \u0995\u09b0\u09c1\u09a8",
      joinButton:
        "\u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa \u09a8\u09bf\u09a8",
      joinButtonMobile:
        "\u09af\u09cb\u0997 \u09a6\u09bf\u09a8",
    },
    hero: {
      badge:
        "\u09aa\u09c7\u09b6\u09be\u09a6\u09be\u09b0 \u09b8\u09cd\u0995\u09bf\u09a8\u0995\u09c7\u09df\u09be\u09b0 \u0995\u09a8\u09b8\u09be\u09b2\u099f\u09c7\u09b6\u09a8",
      heading:
        "\u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u09aa\u09b0\u09be\u09ae\u09b0\u09cd\u09b6, \u0986\u09aa\u09a8\u09be\u09b0 \u09a4\u09cd\u09ac\u0995\u09c7\u09b0 \u099c\u09a8\u09cd\u09af",
      subtext:
        "\u09b8\u09be\u09b0\u09cd\u099f\u09bf\u09ab\u09be\u0987\u09a1 \u098f\u09b8\u09cd\u09a5\u09c7\u099f\u09bf\u09b6\u09bf\u09df\u09be\u09a8 \u09af\u09be\u09b0\u09be \u0986\u09aa\u09a8\u09be\u09b0 \u09a4\u09cd\u09ac\u0995 \u09ac\u09bf\u09b6\u09cd\u09b2\u09c7\u09b7\u09a3 \u0995\u09b0\u09c7 \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4 \u0995\u09c7\u09df\u09be\u09b0 \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8 \u09a4\u09c8\u09b0\u09bf \u0995\u09b0\u09c7\u09a8\u0964",
      primaryButton:
        "\u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa \u09a8\u09bf\u09a8",
      secondaryButton:
        "\u0995\u09b2 \u0995\u09b0\u09c1\u09a8",
      trustBadges: [
        "\u09b8\u09be\u09b0\u09cd\u099f\u09bf\u09ab\u09be\u0987\u09a1 \u09b8\u09cd\u0995\u09bf\u09a8 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e",
        "\u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09c3\u09a4 \u09b8\u09cd\u0995\u09bf\u09a8 \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8",
        "\u0985\u09a8\u09b2\u09be\u0987\u09a8 \u0993 \u0985\u09ab\u09b2\u09be\u0987\u09a8 \u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f",
        "\u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u0997\u09be\u0987\u09a1\u09c7\u09a8\u09cd\u09b8",
      ],
    },
    about: {
      label:
        "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09b8\u09ae\u09cd\u09aa\u09b0\u09cd\u0995\u09c7",
      heading:
        "\u09b8\u09c7\u09b2\u09c7\u09a8\u09be\u0987\u099f \u0995\u09c7\u09df\u09be\u09b0 \u0995\u09c0?",
      body:
        "\u09b8\u09c7\u09b2\u09c7\u09a8\u09be\u0987\u099f \u0995\u09c7\u09df\u09be\u09b0 \u098f\u0995\u099f\u09bf \u09aa\u09c7\u09b6\u09be\u09a6\u09be\u09b0 \u09b8\u09cd\u0995\u09bf\u09a8\u0995\u09c7\u09df\u09be\u09b0 \u0995\u09a8\u09b8\u09be\u09b2\u099f\u09c7\u09b6\u09a8 \u09aa\u09cd\u09b2\u09be\u099f\u09ab\u09b0\u09cd\u09ae \u09af\u09be \u0986\u09aa\u09a8\u09be\u0995\u09c7 \u09b8\u09be\u09b0\u09cd\u099f\u09bf\u09ab\u09be\u0987\u09a1 \u098f\u09b8\u09cd\u09a5\u09c7\u099f\u09bf\u09b6\u09bf\u09df\u09be\u09a8 \u0993 \u09b8\u09cd\u0995\u09bf\u09a8 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e\u09a6\u09c7\u09b0 \u09b8\u09be\u09a5\u09c7 \u09b8\u0982\u09af\u09c1\u0995\u09cd\u09a4 \u0995\u09b0\u09c7\u0964 \u0986\u09ae\u09b0\u09be \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09c3\u09a4 \u09b8\u09cd\u0995\u09bf\u09a8 \u09ac\u09bf\u09b6\u09cd\u09b2\u09c7\u09b7\u09a3, \u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u0987\u099c\u09a1 \u09b0\u09c1\u099f\u09bf\u09a8 \u098f\u09ac\u0982 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u09aa\u09a3\u09cd\u09af \u09b8\u09c1\u09aa\u09be\u09b0\u09bf\u09b6 \u09aa\u09cd\u09b0\u09a6\u09be\u09a8 \u0995\u09b0\u09bf\u0964",
      bullets: [
        "\u09b8\u09be\u09b0\u09cd\u099f\u09bf\u09ab\u09be\u0987\u09a1 \u09b8\u09cd\u0995\u09bf\u09a8 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e",
        "\u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09c3\u09a4 \u0995\u09c7\u09df\u09be\u09b0 \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8",
        "\u0985\u09a8\u09b2\u09be\u0987\u09a8 \u0993 \u0985\u09ab\u09b2\u09be\u0987\u09a8 \u0995\u09a8\u09b8\u09be\u09b2\u099f\u09c7\u09b6\u09a8",
        "\u099a\u09b2\u09ae\u09be\u09a8 \u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f \u0993 \u0997\u09be\u0987\u09a1\u09c7\u09a8\u09cd\u09b8",
      ],
      stats: [
        {
          number: "\u09eb\u09e6\u09e6+",
          label:
            "\u09b8\u09a8\u09cd\u09a4\u09c1\u09b7\u09cd\u099f \u0995\u09cd\u09b2\u09be\u09df\u09c7\u09a8\u09cd\u099f",
        },
        {
          number: "\u09e9",
          label:
            "\u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8",
        },
        {
          number: "\u09e7\u09e6\u09e6%",
          label:
            "\u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09c3\u09a4",
        },
        {
          number: "\u09e8\u09ea/\u09ed",
          label:
            "\u0985\u09a8\u09b2\u09be\u0987\u09a8 \u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f",
        },
      ],
    },
    membership: {
      heading:
        "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8",
      subtext:
        "\u0986\u09aa\u09a8\u09be\u09b0 \u09a4\u09cd\u09ac\u0995\u09c7\u09b0 \u09b0\u09c2\u09aa\u09be\u09a8\u09cd\u09a4\u09b0\u09c7\u09b0 \u09b2\u0995\u09cd\u09b7\u09cd\u09af \u0985\u09a8\u09c1\u09af\u09be\u09af\u09bc\u09c0 \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8 \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8\u0964",
      signature: {
        title:
          "\u09b8\u09bf\u0997\u09a8\u09c7\u099a\u09be\u09b0",
        duration:
          "\u09e8 \u09ae\u09be\u09b8",
        price:
          "\u09ea\u09ef\u09e6 \u099f\u09be\u0995\u09be",
        original:
          "\u09ef\u09ef\u09e6 \u099f\u09be\u0995\u09be",
        badge:
          "\u09eb\u09e7% \u099b\u09be\u09dc",
        benefits: [
          "\u09ec\u09e6 \u09a6\u09bf\u09a8 \u09b8\u09cd\u0995\u09bf\u09a8\u0995\u09c7\u09df\u09be\u09b0 \u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f",
          "\u09a4\u09cd\u09ac\u0995, \u099a\u09c1\u09b2 \u0993 \u09b6\u09b0\u09c0\u09b0 \u09ac\u09bf\u09b6\u09cd\u09b2\u09c7\u09b7\u09a3",
          "\u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u0995\u09a8\u09b8\u09be\u09b2\u099f\u09c7\u09b6\u09a8",
          "\u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09c3\u09a4 \u09b0\u09c1\u099f\u09bf\u09a8",
        ],
        button:
          "\u09b8\u09bf\u0997\u09a8\u09c7\u099a\u09be\u09b0 \u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa \u09a8\u09bf\u09a8",
        link: "/membership/payment?tier=SIGNATURE",
      },
      crystal: {
        title:
          "\u0995\u09cd\u09b0\u09bf\u09b8\u09cd\u099f\u09be\u09b2",
        duration:
          "\u09e7\u09e8 \u09ae\u09be\u09b8",
        benefits: [
          "\u09e7 \u09ac\u099b\u09b0 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f",
          "\u098f\u09b8\u09cd\u09a5\u09c7\u099f\u09bf\u09b6\u09bf\u09df\u09be\u09a8, \u09a8\u09bf\u0989\u099f\u09cd\u09b0\u09bf\u09b6\u09a8\u09bf\u09b8\u09cd\u099f \u0993 \u09b8\u09be\u0987\u0995\u09bf\u09df\u09be\u099f\u09cd\u09b0\u09bf\u09b8\u09cd\u099f",
          "\u0985\u09cd\u09af\u09be\u09a1\u09ad\u09be\u09a8\u09cd\u09b8\u09a1 \u09b8\u09cd\u0995\u09bf\u09a8 \u0985\u09cd\u09af\u09be\u09b8\u09c7\u09b8\u09ae\u09c7\u09a8\u09cd\u099f",
          "\u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u0987\u099c\u09a1 \u0995\u09c7\u09df\u09be\u09b0 \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8",
        ],
        button:
          "\u09b6\u09c0\u0998\u09cd\u09b0\u0987 \u0986\u09b8\u099b\u09c7",
        disabled: true,
      },
      platinum: {
        title:
          "\u09aa\u09cd\u09b2\u09be\u099f\u09bf\u09a8\u09be\u09ae",
        duration:
          "\u09e9\u09ec \u09ae\u09be\u09b8",
        benefits: [
          "\u09e9 \u09ac\u099b\u09b0 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f",
          "\u09aa\u09a3\u09cd\u09af \u0995\u09c7\u09a8\u09be\u09df \u09eb% \u099b\u09be\u09dc",
          "\u0985\u09cd\u09af\u09be\u09a1\u09ad\u09be\u09a8\u09cd\u09b8\u09a1 \u09b8\u09cd\u0995\u09bf\u09a8 \u09ae\u09cd\u09af\u09be\u09aa\u09bf\u0982",
          "\u09aa\u09cd\u09b0\u0997\u09cd\u09b0\u09c7\u09b8 \u09ae\u09a8\u09bf\u099f\u09b0\u09bf\u0982",
        ],
        button:
          "\u09b6\u09c0\u0998\u09cd\u09b0\u0987 \u0986\u09b8\u099b\u09c7",
        disabled: true,
      },
    },
    howItWorks: {
      heading:
        "\u0995\u09c0\u09ad\u09be\u09ac\u09c7 \u0995\u09be\u099c \u0995\u09b0\u09c7",
      steps: [
        {
          n: "\u09e6\u09e7",
          title:
            "\u09b0\u09c7\u099c\u09bf\u09b8\u09cd\u099f\u09cd\u09b0\u09c7\u09b6\u09a8 \u0995\u09b0\u09c1\u09a8",
          desc:
            "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u0993\u09df\u09c7\u09ac\u09b8\u09be\u0987\u099f\u09c7 \u09ac\u09bf\u09a8\u09be\u09ae\u09c2\u09b2\u09cd\u09af\u09c7 \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09a4\u09c8\u09b0\u09bf \u0995\u09b0\u09c1\u09a8\u0964",
        },
        {
          n: "\u09e6\u09e8",
          title:
            "\u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8",
          desc:
            "\u0986\u09aa\u09a8\u09be\u09b0 \u09a4\u09cd\u09ac\u0995\u09c7\u09b0 \u09b2\u0995\u09cd\u09b7\u09cd\u09af \u0985\u09a8\u09c1\u09af\u09be\u09af\u09bc\u09c0 \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8 \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8\u0964",
        },
        {
          n: "\u09e6\u09e9",
          title:
            "\u0995\u09a8\u09b8\u09be\u09b2\u099f\u09c7\u09b6\u09a8 \u09ac\u09c1\u0995 \u0995\u09b0\u09c1\u09a8",
          desc:
            "\u0986\u09aa\u09a8\u09be\u09b0 \u09aa\u099b\u09a8\u09cd\u09a6\u09c7\u09b0 \u09a1\u09be\u0995\u09cd\u09a4\u09be\u09b0 \u0993 \u09a4\u09be\u09b0\u09bf\u0996 \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8\u0964",
        },
        {
          n: "\u09e6\u09ea",
          title:
            "\u09a4\u09cd\u09ac\u0995 \u09b0\u09c2\u09aa\u09be\u09a8\u09cd\u09a4\u09b0 \u0995\u09b0\u09c1\u09a8",
          desc:
            "\u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09c3\u09a4 \u09aa\u09b0\u09bf\u0995\u09b2\u09cd\u09aa\u09a8\u09be \u0985\u09a8\u09c1\u09b8\u09b0\u09a3 \u0995\u09b0\u09c1\u09a8 \u098f\u09ac\u0982 \u09ab\u09b2\u09be\u09ab\u09b2 \u09a6\u09c7\u0996\u09c1\u09a8\u0964",
        },
      ],
    },
    video: {
      heading:
        "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u0995\u09be\u099c \u09a6\u09c7\u0996\u09c1\u09a8",
      subtext:
        "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u09a6\u09b2 \u0995\u09c0\u09ad\u09be\u09ac\u09c7 \u09b8\u09cd\u0995\u09bf\u09a8 \u0995\u09a8\u09b8\u09be\u09b2\u099f\u09c7\u09b6\u09a8 \u09aa\u09b0\u09bf\u099a\u09be\u09b2\u09a8\u09be \u0995\u09b0\u09c7 \u098f\u09ac\u0982 \u099c\u09c0\u09ac\u09a8 \u09aa\u09b0\u09bf\u09ac\u09b0\u09cd\u09a4\u09a8 \u0995\u09b0\u09c7 \u09a4\u09be \u09a6\u09c7\u0996\u09c1\u09a8\u0964",
    },
    doctors: {
      heading:
        "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u09a6\u09b2",
      subtext:
        "\u0986\u09aa\u09a8\u09be\u09b0 \u09a4\u09cd\u09ac\u0995\u09c7\u09b0 \u09b8\u09cd\u09ac\u09be\u09b8\u09cd\u09a5\u09cd\u09af\u09c7 \u09a8\u09bf\u09ac\u09c7\u09a6\u09bf\u09a4 \u09b8\u09be\u09b0\u09cd\u099f\u09bf\u09ab\u09be\u0987\u09a1 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e\u0997\u09a3\u0964",
    },
    // PLACEHOLDER - REPLACE WITH REAL CONTENT
    testimonials: {
      heading:
        "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u0995\u09cd\u09b2\u09be\u09af\u09bc\u09c7\u09a8\u09cd\u099f\u09b0\u09be \u0995\u09c0 \u09ac\u09b2\u09c7\u09a8",
      items: [
        {
          name: "\u09a8\u09c1\u09b8\u09b0\u09be\u09a4 \u099c\u09c7.",
          concern:
            "\u09ac\u09cd\u09b0\u09a3 \u0993 \u09aa\u09bf\u0997\u09ae\u09c7\u09a8\u09cd\u099f\u09c7\u09b6\u09a8",
          text:
            "\u09b8\u09c7\u09b2\u09c7\u09a8\u09be\u0987\u099f \u0995\u09c7\u09df\u09be\u09b0 \u0986\u09ae\u09be\u09b0 \u09a4\u09cd\u09ac\u0995 \u09b8\u09ae\u09cd\u09aa\u09c2\u09b0\u09cd\u09a3 \u09aa\u09b0\u09bf\u09ac\u09b0\u09cd\u09a4\u09a8 \u0995\u09b0\u09c7 \u09a6\u09bf\u09af\u09bc\u09c7\u099b\u09c7\u0964 \u09ae\u09be\u09a4\u09cd\u09b0 \u09e8 \u09ae\u09be\u09b8\u09c7 \u0986\u09ae\u09be\u09b0 \u09ac\u09cd\u09b0\u09a3\u09c7\u09b0 \u09a6\u09be\u0997 \u0985\u09a8\u09c7\u0995 \u0995\u09ae\u09c7 \u0997\u09c7\u099b\u09c7!",
        },
        {
          name: "\u09b0\u09be\u09ac\u09c7\u09af\u09bc\u09be \u0995\u09c7.",
          concern:
            "\u09b6\u09c1\u09b7\u09cd\u0995 \u0993 \u09b8\u0982\u09ac\u09c7\u09a6\u09a8\u09b6\u09c0\u09b2 \u09a4\u09cd\u09ac\u0995",
          text:
            "\u0986\u09ae\u09be\u09b0 \u09b8\u0982\u09ac\u09c7\u09a6\u09a8\u09b6\u09c0\u09b2 \u09a4\u09cd\u09ac\u0995\u09c7\u09b0 \u09b8\u09ae\u09be\u09a7\u09be\u09a8 \u0985\u09ac\u09b6\u09c7\u09b7\u09c7 \u09aa\u09c7\u09b2\u09be\u09ae\u0964 \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4\u0995\u09c3\u09a4 \u09aa\u09b0\u09be\u09ae\u09b0\u09cd\u09b6 \u098f\u0995\u09a6\u09ae \u09b8\u09a0\u09bf\u0995 \u099b\u09bf\u09b2\u0964",
        },
        {
          name: "\u09ab\u09be\u09a4\u09c7\u09ae\u09be \u0986.",
          concern:
            "\u09a4\u09c8\u09b2\u09be\u0995\u09cd\u09a4 \u09a4\u09cd\u09ac\u0995",
          text:
            "\u0995\u09a8\u09b8\u09be\u09b2\u099f\u09c7\u09b6\u09a8 \u0985\u09a4\u09cd\u09af\u09a8\u09cd\u09a4 \u09ac\u09bf\u09b8\u09cd\u09a4\u09be\u09b0\u09bf\u09a4 \u099b\u09bf\u09b2 \u098f\u09ac\u0982 \u09aa\u09a3\u09cd\u09af\u09c7\u09b0 \u09aa\u09b0\u09be\u09ae\u09b0\u09cd\u09b6 \u0986\u09ae\u09be\u09b0 \u09a4\u09cd\u09ac\u0995\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u098f\u0995\u09a6\u09ae \u0989\u09aa\u09af\u09c1\u0995\u09cd\u09a4 \u099b\u09bf\u09b2\u0964",
        },
      ],
    },
    faq: {
      heading:
        "\u09b8\u09be\u09a7\u09be\u09b0\u09a3 \u09aa\u09cd\u09b0\u09b6\u09cd\u09a8\u09b8\u09ae\u09c2\u09b9",
    },
    leadCapture: {
      label:
        "\u0986\u0997\u09cd\u09b0\u09b9\u09c0?",
      heading:
        "\u0986\u09ae\u09b0\u09be \u0986\u09aa\u09a8\u09be\u0995\u09c7 \u0995\u09b2 \u0995\u09b0\u09ac",
      subtext:
        "\u0986\u09aa\u09a8\u09be\u09b0 \u09a4\u09a5\u09cd\u09af \u09a6\u09bf\u09a8, \u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u099f\u09bf\u09ae \u09e8\u09ea \u0998\u09a3\u09cd\u099f\u09be\u09b0 \u09ae\u09a7\u09cd\u09af\u09c7 \u09af\u09cb\u0997\u09be\u09af\u09cb\u0997 \u0995\u09b0\u09ac\u09c7\u0964",
      namePlaceholder:
        "\u0986\u09aa\u09a8\u09be\u09b0 \u09aa\u09c2\u09b0\u09cd\u09a3 \u09a8\u09be\u09ae",
      phonePlaceholder:
        "\u0986\u09aa\u09a8\u09be\u09b0 \u09ab\u09cb\u09a8 \u09a8\u09ae\u09cd\u09ac\u09b0",
      phoneNote:
        "\u0986\u09ae\u09b0\u09be \u098f\u0987 \u09a8\u09ae\u09cd\u09ac\u09b0\u09c7 \u0995\u09b2 \u09ac\u09be WhatsApp \u0995\u09b0\u09ac",
      emailPlaceholder:
        "\u0987\u09ae\u09c7\u0987\u09b2 \u09a0\u09bf\u0995\u09be\u09a8\u09be (\u0990\u099a\u09cd\u099b\u09bf\u0995)",
      interestLabel:
        "\u0995\u09cb\u09a8 \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u09a8\u09c7 \u0986\u0997\u09cd\u09b0\u09b9\u09c0?",
      interestOptions: [
        "\u09a8\u09bf\u09b6\u09cd\u099a\u09bf\u09a4 \u09a8\u0987",
        "\u09b8\u09bf\u0997\u09a8\u09c7\u099a\u09be\u09b0 \u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa",
        "\u0995\u09cd\u09b0\u09bf\u09b8\u09cd\u099f\u09be\u09b2 \u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa",
        "\u09aa\u09cd\u09b2\u09be\u099f\u09bf\u09a8\u09be\u09ae \u09ae\u09c7\u09ae\u09cd\u09ac\u09be\u09b0\u09b6\u09bf\u09aa",
      ],
      buttonText:
        "\u0986\u09ae\u09be\u09b0 \u09a4\u09a5\u09cd\u09af \u09aa\u09be\u09a0\u09be\u09a8",
      successMessage:
        "\u09a7\u09a8\u09cd\u09af\u09ac\u09be\u09a6! \u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u099f\u09bf\u09ae \u09e8\u09ea \u0998\u09a3\u09cd\u099f\u09be\u09b0 \u09ae\u09a7\u09cd\u09af\u09c7 \u09af\u09cb\u0997\u09be\u09af\u09cb\u0997 \u0995\u09b0\u09ac\u09c7\u0964 \u{1F31F}",
      errorMessage:
        "\u0995\u09bf\u099b\u09c1 \u098f\u0995\u099f\u09be \u09ad\u09c1\u09b2 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964 \u0986\u09ac\u09be\u09b0 \u099a\u09c7\u09b7\u09cd\u099f\u09be \u0995\u09b0\u09c1\u09a8 \u09ac\u09be \u09b8\u09b0\u09be\u09b8\u09b0\u09bf \u0995\u09b2 \u0995\u09b0\u09c1\u09a8\u0964",
    },
    registration: {
      label:
        "\u09b0\u09c7\u099c\u09bf\u09b8\u09cd\u099f\u09cd\u09b0\u09c7\u09b6\u09a8",
      heading:
        "\u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09a4\u09c8\u09b0\u09bf \u0995\u09b0\u09c1\u09a8",
      subtext:
        "\u098f\u0987 \u09aa\u09c7\u099c \u09a5\u09c7\u0995\u09c7\u0987 \u09b0\u09c7\u099c\u09bf\u09b8\u09cd\u099f\u09b0 \u0995\u09b0\u09c7 \u0985\u09cd\u09af\u09be\u09aa\u09df\u09c7\u09a8\u09cd\u099f\u09ae\u09c7\u09a8\u09cd\u099f \u09ac\u09c1\u0995 \u0993 \u0986\u09aa\u09a8\u09be\u09b0 \u09b8\u09cd\u0995\u09bf\u09a8\u0995\u09c7\u09df\u09be\u09b0 \u099c\u09be\u09b0\u09cd\u09a8\u09bf \u09aa\u09b0\u09bf\u099a\u09be\u09b2\u09a8\u09be \u0995\u09b0\u09c1\u09a8\u0964",
      openButton:
        "\u098f\u0996\u09a8\u0987 \u09b0\u09c7\u099c\u09bf\u09b8\u09cd\u099f\u09b0 \u0995\u09b0\u09c1\u09a8",
      modalTitle:
        "\u09b8\u09c7\u09b2\u09c7\u09a8\u09be\u0987\u099f \u0995\u09c7\u09df\u09be\u09b0\u09c7 \u09af\u09cb\u0997 \u09a6\u09bf\u09a8",
      modalSubtext:
        "\u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09a4\u09c8\u09b0\u09bf \u0995\u09b0\u09c7 \u0985\u09cd\u09af\u09be\u09aa\u09df\u09c7\u09a8\u09cd\u099f\u09ae\u09c7\u09a8\u09cd\u099f \u09ac\u09c1\u0995 \u0993 \u0986\u09aa\u09a8\u09be\u09b0 \u0995\u09c7\u09df\u09be\u09b0 \u09ae\u09cd\u09af\u09be\u09a8\u09c7\u099c \u0995\u09b0\u09c1\u09a8\u0964",
      nameLabel: "\u09a8\u09be\u09ae",
      phoneLabel: "\u09ab\u09cb\u09a8",
      emailLabel: "\u0987\u09ae\u09c7\u0987\u09b2",
      dobLabel:
        "\u099c\u09a8\u09cd\u09ae \u09a4\u09be\u09b0\u09bf\u0996",
      passwordLabel:
        "\u09aa\u09be\u09b8\u0993\u09df\u09be\u09b0\u09cd\u09a1",
      submitButton:
        "\u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09a4\u09c8\u09b0\u09bf \u0995\u09b0\u09c1\u09a8",
      submittingButton:
        "\u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09a4\u09c8\u09b0\u09bf \u09b9\u099a\u09cd\u099b\u09c7...",
      successTitle:
        "\u0987\u09ae\u09c7\u0987\u09b2 \u09ad\u09c7\u09b0\u09bf\u09ab\u09be\u0987 \u0995\u09b0\u09c1\u09a8",
      successPrefix:
        "\u0986\u09ae\u09b0\u09be \u098f\u0987 \u0987\u09ae\u09c7\u0987\u09b2\u09c7 \u09ad\u09c7\u09b0\u09bf\u09ab\u09bf\u0995\u09c7\u09b6\u09a8 \u09b2\u09bf\u0999\u09cd\u0995 \u09aa\u09be\u09a0\u09bf\u09df\u09c7\u099b\u09bf",
      successSuffix:
        "\u0964 \u0987\u09a8\u09ac\u0995\u09cd\u09b8 \u099a\u09c7\u0995 \u0995\u09b0\u09c7 \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u098f\u0995\u09cd\u099f\u09bf\u09ad \u0995\u09b0\u09c1\u09a8\u0964",
      resendButton:
        "\u09aa\u09c1\u09a8\u09b0\u09be\u09df \u09ad\u09c7\u09b0\u09bf\u09ab\u09bf\u0995\u09c7\u09b6\u09a8 \u0987\u09ae\u09c7\u0987\u09b2 \u09aa\u09be\u09a0\u09be\u09a8",
      resendSending:
        "\u09aa\u09be\u09a0\u09be\u09a8\u09cb \u09b9\u099a\u09cd\u099b\u09c7...",
      resendSuccess:
        "\u09ad\u09c7\u09b0\u09bf\u09ab\u09bf\u0995\u09c7\u09b6\u09a8 \u0987\u09ae\u09c7\u0987\u09b2 \u0986\u09ac\u09be\u09b0 \u09aa\u09be\u09a0\u09be\u09a8\u09cb \u09b9\u09df\u09c7\u099b\u09c7\u0964",
      existingAccount:
        "\u098f\u0987 \u0987\u09ae\u09c7\u0987\u09b2\u09c7 \u0986\u0997\u09c7\u0987 \u098f\u0995\u099f\u09bf \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u0986\u099b\u09c7\u0964 \u09b8\u09ae\u09cd\u09aa\u09cd\u09b0\u09a4\u09bf \u09b0\u09c7\u099c\u09bf\u09b8\u09cd\u099f\u09b0 \u0995\u09b0\u09c7 \u09a5\u09be\u0995\u09b2\u09c7 \u09ad\u09c7\u09b0\u09bf\u09ab\u09bf\u0995\u09c7\u09b6\u09a8 \u0987\u09ae\u09c7\u0987\u09b2 \u099a\u09c7\u0995 \u0995\u09b0\u09c1\u09a8\u0964",
      loginPrompt:
        "\u0986\u0997\u09c7\u09b0 \u0987\u0989\u099c\u09be\u09b0?",
      loginLink:
        "\u098f\u0996\u09be\u09a8\u09c7 \u09b2\u0997\u0987\u09a8 \u0995\u09b0\u09c1\u09a8\u0964",
      closeButton:
        "\u09ac\u09a8\u09cd\u09a7 \u0995\u09b0\u09c1\u09a8",
      phoneError:
        "\u0985\u09a8\u09c1\u0997\u09cd\u09b0\u09b9 \u0995\u09b0\u09c7 \u09b8\u09a0\u09bf\u0995 \u09ab\u09cb\u09a8 \u09a8\u09ae\u09cd\u09ac\u09b0 \u09a6\u09bf\u09a8\u0964",
      fallbackError:
        "\u09b0\u09c7\u099c\u09bf\u09b8\u09cd\u099f\u09cd\u09b0\u09c7\u09b6\u09a8 \u09ac\u09cd\u09af\u09b0\u09cd\u09a5 \u09b9\u09df\u09c7\u099b\u09c7\u0964 \u0986\u09ac\u09be\u09b0 \u099a\u09c7\u09b7\u09cd\u099f\u09be \u0995\u09b0\u09c1\u09a8\u0964",
    },
    contact: {
      heading:
        "\u09af\u09cb\u0997\u09be\u09af\u09cb\u0997 \u0995\u09b0\u09c1\u09a8",
      card1Label:
        "\u09ab\u09cb\u09a8 \u0995\u09b0\u09c1\u09a8",
      card2Label:
        "WhatsApp \u0995\u09b0\u09c1\u09a8",
      card3Label:
        "\u09ab\u09c7\u09b8\u09ac\u09c1\u0995 \u09aa\u09c7\u099c",
      bigButton:
        "\ud83d\udcde \u098f\u0996\u09a8\u0987 \u0995\u09b2 \u0995\u09b0\u09c1\u09a8",
    },
    footer: {
      copyright:
        "\u00a9 \u09e8\u09e6\u09e8\u09ec \u09b8\u09c7\u09b2\u09c7\u09a8\u09be\u0987\u099f \u0995\u09c7\u09df\u09be\u09b0\u0964 \u09b8\u09b0\u09cd\u09ac\u09b8\u09cd\u09ac\u09a4\u09cd\u09ac \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4\u0964",
    },
  },
} as const;

const LANDING_VIDEO_URL =
  "https://www.facebook.com/reel/2118318732423295"; // PLACEHOLDER - replace with real video URL

type Language = keyof typeof CONTENT;

type LandingDoctor = {
  id: string;
  name: string;
  designation: string;
  image: string | null;
  specialization: string;
  isActive?: boolean;
};

type DoctorsResponse = {
  doctors?: LandingDoctor[];
  error?: string;
};

function getInactiveLanguageLabel(language: Language) {
  return language === "en"
    ? "\u09ac\u09be\u0982\u09b2\u09be"
    : "English";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getSpecializationLabel(language: Language, specialization: string) {
  const labels = {
    en: {
      AESTHETICIAN: "Aesthetician",
      NUTRITIONIST: "Nutritionist",
      PSYCHIATRIST: "Psychiatrist",
    },
    bn: {
      AESTHETICIAN:
        "\u098f\u09b8\u09cd\u09a5\u09c7\u099f\u09bf\u09b6\u09bf\u09df\u09be\u09a8",
      NUTRITIONIST:
        "\u09a8\u09bf\u0989\u099f\u09cd\u09b0\u09bf\u09b6\u09a8\u09bf\u09b8\u09cd\u099f",
      PSYCHIATRIST:
        "\u09b8\u09be\u0987\u0995\u09bf\u09df\u09be\u099f\u09cd\u09b0\u09bf\u09b8\u09cd\u099f",
    },
  } as const;

  return (
    labels[language][
      specialization as keyof (typeof labels)[typeof language]
    ] ?? specialization
  );
}

function trackMetaPixelEvent(eventName: string) {
  if (typeof window !== "undefined" && typeof window.fbq !== "undefined") {
    window.fbq("track", eventName);
  }
}

export default function LandingPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [openFaqId, setOpenFaqId] = useState<string | null>("1");
  const headerContent = CONTENT[language].header;
  const heroContent = CONTENT[language].hero;
  const aboutContent = CONTENT[language].about;
  const membershipContent = CONTENT[language].membership;
  const howItWorksContent = CONTENT[language].howItWorks;
  const videoContent = CONTENT[language].video;
  const doctorsContent = CONTENT[language].doctors;
  const testimonialsContent = CONTENT[language].testimonials;
  const faqContent = CONTENT[language].faq;
  const registrationContent = CONTENT[language].registration;
  const contactContent = CONTENT[language].contact;
  const footerContent = CONTENT[language].footer;
  const [doctors, setDoctors] = useState<LandingDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [showExistingAccountNotice, setShowExistingAccountNotice] =
    useState(false);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [registerPhone, setRegisterPhone] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const membershipPlans = [
    membershipContent.signature,
    membershipContent.crystal,
    membershipContent.platinum,
  ];
  const faqItems = FAQS.filter((item) =>
    ["1", "2", "3", "6", "11", "14"].includes(item.id),
  );
  const noDoctorsMessage =
    language === "en"
      ? "Our expert team is ready to help you."
      : "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09ac\u09bf\u09b6\u09c7\u09b7\u099c\u09cd\u099e \u09a6\u09b2 \u0986\u09aa\u09a8\u09be\u0995\u09c7 \u09b8\u09be\u09b9\u09be\u09af\u09cd\u09af \u0995\u09b0\u09be\u09b0 \u099c\u09a8\u09cd\u09af \u09aa\u09cd\u09b0\u09b8\u09cd\u09a4\u09c1\u09a4\u0964";
  const contactButtonLabels =
    language === "en"
      ? {
          callNow: "Call Now",
          whatsappNow: "WhatsApp Now",
          visitPage: "Visit Page",
          mobileCall: "Call",
          mobileWhatsApp: "WhatsApp",
        }
      : {
          callNow: "\u0995\u09b2 \u0995\u09b0\u09c1\u09a8",
          whatsappNow: "WhatsApp \u0995\u09b0\u09c1\u09a8",
          visitPage:
            "\u09aa\u09c7\u099c \u09a6\u09c7\u0996\u09c1\u09a8",
          mobileCall: "\u0995\u09b2",
          mobileWhatsApp: "WhatsApp",
        };

  useEffect(() => {
    let isMounted = true;

    async function loadDoctors() {
      try {
        const response = await fetch("/api/appointment/doctors", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | DoctorsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load doctors.");
        }

        if (!isMounted) {
          return;
        }

        setDoctors(
          (data?.doctors ?? [])
            .filter((doctor) => doctor.isActive !== false)
            .slice(0, 8),
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setDoctors([]);
      } finally {
        if (isMounted) {
          setIsLoadingDoctors(false);
        }
      }
    }

    void loadDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  function openRegisterModal() {
    setShowRegisterModal(true);
  }

  function closeRegisterModal() {
    setShowRegisterModal(false);
    setRegisterError("");
    setShowExistingAccountNotice(false);
    setResendError("");
    setResendSuccess("");
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmittingRegister) {
      return;
    }

    setIsSubmittingRegister(true);
    setRegisterError("");
    setShowExistingAccountNotice(false);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "");

    if (!registerPhone || !isValidPhoneNumber(registerPhone)) {
      setRegisterError(registrationContent.phoneError);
      setIsSubmittingRegister(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone: registerPhone,
          email,
          password,
          dateOfBirth,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        if (response.status === 409) {
          setShowExistingAccountNotice(true);
          return;
        }

        setRegisterError(
          data?.error ?? registrationContent.fallbackError,
        );
        return;
      }

      trackMetaPixelEvent("Lead");
      trackMetaPixelEvent("CompleteRegistration");
      setRegisteredEmail(email);
      setResendCountdown(60);
    } catch {
      setRegisterError(registrationContent.fallbackError);
    } finally {
      setIsSubmittingRegister(false);
    }
  }

  async function handleResendVerification() {
    if (!registeredEmail || resendCountdown > 0) {
      return;
    }

    setResendError("");
    setResendSuccess("");
    setIsResending(true);

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.error ?? registrationContent.fallbackError,
        );
      }

      setResendSuccess(registrationContent.resendSuccess);
      setResendCountdown(60);
    } catch (error) {
      setResendError(
        error instanceof Error
          ? error.message
          : registrationContent.fallbackError,
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8F5F0] font-sans text-[#2B2B2B] dark:bg-[#141210] dark:text-[#F0EDE8]">
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .brand-phone-input-wrapper .PhoneInput {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 48px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid #d8c7b5;
          background-color: #ffffff;
          padding: 0 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .brand-phone-input-wrapper .PhoneInput:focus-within {
          border-color: #c6a56b;
          box-shadow: 0 0 0 1px #c6a56b;
        }

        .brand-phone-input-wrapper .PhoneInputCountry {
          margin-right: 0;
        }

        .brand-phone-input-wrapper .PhoneInputCountrySelect {
          cursor: pointer;
        }

        .brand-phone-input-wrapper .PhoneInputCountryIcon {
          box-shadow: none;
        }

        .brand-phone-input-wrapper .PhoneInputCountrySelectArrow {
          color: #b8a89a;
          opacity: 1;
        }

        .brand-phone-input-wrapper .PhoneInputInput {
          height: 100%;
          width: 100%;
          border: 0;
          background: transparent;
          color: #2b2b2b;
          font-size: 14px;
          outline: none;
          box-shadow: none;
        }

        .brand-phone-input-wrapper .PhoneInputInput::placeholder {
          color: #b8a89a;
        }

        .dark .brand-phone-input-wrapper .PhoneInput {
          border-color: #3d3530;
          background-color: #1a1814;
        }

        .dark .brand-phone-input-wrapper .PhoneInputCountrySelectArrow {
          color: #8a7d75;
        }

        .dark .brand-phone-input-wrapper .PhoneInputInput {
          color: #f0ede8;
        }

        .dark .brand-phone-input-wrapper .PhoneInputInput::placeholder {
          color: #8a7d75;
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-[#D8C7B5] bg-[#F8F5F0] px-4 py-3 dark:border-[#3D3530] dark:bg-[#141210]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 sm:gap-3">
          <Link
            href="/landing"
            className="min-w-0 shrink-0 transition-opacity hover:opacity-85"
          >
            <p
              className="text-lg font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-2xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Selenite Care
            </p>
            <p className="mt-1 text-xs text-[#B8A89A] dark:text-[#8A7D75]">
              {headerContent.tagline}
            </p>
          </Link>

          <button
            type="button"
            onClick={() =>
              setLanguage((current) => (current === "en" ? "bn" : "en"))
            }
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[#C6A56B] bg-[#D8C7B5] px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#E3D5C7] dark:bg-[#221d1a] dark:text-[#F0EDE8] dark:hover:bg-[#2A241F]"
            aria-label={`Switch language to ${getInactiveLanguageLabel(language)}`}
          >
            {getInactiveLanguageLabel(language)}
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href="tel:+8801647660300"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#C6A56B] px-3 text-sm font-medium text-[#C6A56B] transition-colors hover:bg-[#C6A56B]/8 dark:text-[#D4B47A] dark:hover:bg-[#D4B47A]/10 sm:px-4"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">{headerContent.callButton}</span>
            </a>

            <Link
              href="/services"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[#2B2B2B] px-3 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A] sm:px-4"
            >
              <span className="sm:hidden">{headerContent.joinButtonMobile}</span>
              <span className="hidden sm:inline">{headerContent.joinButton}</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-[#F8F5F0] px-4 py-6 dark:bg-[#141210] sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl rounded-[32px] border border-[#D8C7B5] bg-[radial-gradient(circle_at_top_right,_rgba(198,165,107,0.16),_transparent_35%),linear-gradient(180deg,#F3EEE6_0%,#ECF1E6_100%)] p-4 shadow-[0_24px_70px_rgba(43,43,43,0.10)] dark:border-[#3D3530] dark:bg-[radial-gradient(circle_at_top_right,_rgba(198,165,107,0.12),_transparent_30%),linear-gradient(180deg,#171411_0%,#1C1916_100%)] sm:p-5 lg:p-6">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
              <div className="relative h-[280px] overflow-hidden rounded-[24px] border-2 border-white/80 bg-[#E6D8C8] shadow-[0_16px_50px_rgba(43,43,43,0.12)] dark:border-[#F0EDE8]/10 sm:h-[360px] lg:h-[440px] xl:h-auto xl:min-h-[520px]">
                <Image
                  src="https://res.cloudinary.com/dwokjn6zk/image/upload/v1782471237/WhatsApp_Image_2026-06-26_at_4.52.20_PM_paxatd.jpg"
                  alt="Selenite Care online skincare consultation"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 55vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(43,43,43,0.10)] to-transparent" />
              </div>

              <div className="flex items-center rounded-[24px] bg-white/55 px-1 py-2 dark:bg-white/[0.03] sm:px-3 lg:px-4">
                <div className="w-full">
                  <span className="inline-flex rounded-full bg-[#C6A56B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2B2B2B] dark:bg-[#D4B47A]">
                    {heroContent.badge}
                  </span>

                  <h1
                    className="mt-4 max-w-xl text-3xl font-semibold leading-[1.08] text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl lg:text-5xl"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {heroContent.heading}
                  </h1>

                  <p className="mt-5 max-w-lg text-base leading-8 text-[#7D7066] dark:text-[#9B8E84]">
                    {heroContent.subtext}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/services"
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-[#2B2B2B] px-6 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                    >
                      {heroContent.primaryButton}
                    </Link>
                    <a
                      href="tel:+8801647660300"
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-[#8C7967] bg-white/40 px-6 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-white/70 dark:border-[#8A7D75] dark:bg-white/5 dark:text-[#F0EDE8] dark:hover:bg-white/10"
                    >
                      {heroContent.secondaryButton}
                    </a>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-4 lg:grid-cols-4 xl:grid-cols-2">
                    {heroContent.trustBadges.map((badge) => (
                      <div
                        key={badge}
                        className="flex items-start gap-2 text-sm font-medium leading-6 text-[#4D463F] dark:text-[#B8A89A]"
                      >
                        <Check className="mt-1 h-4 w-4 shrink-0 text-[#C6A56B]" />
                        <span>{badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F8F5F0] px-6 py-12 dark:bg-[#141210]">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A56B] sm:text-sm">
                {aboutContent.label}
              </p>

              <h2
                className="mt-4 text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {aboutContent.heading}
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-[#B8A89A] dark:text-[#8A7D75]">
                {aboutContent.body}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {aboutContent.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-start gap-3 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]"
                  >
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#C6A56B]" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {aboutContent.stats.map((stat) => (
                <article
                  key={`${stat.number}-${stat.label}`}
                  className="rounded-xl border border-[#D8C7B5] bg-white px-5 py-6 text-center dark:border-[#3D3530] dark:bg-[#242220]"
                >
                  <p
                    className="text-3xl font-semibold text-[#C6A56B] sm:text-4xl"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {stat.number}
                  </p>
                  <p className="mt-3 text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {stat.label}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#D8C7B5] px-6 py-12 dark:bg-[#221d1a]">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {membershipContent.heading}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                {membershipContent.subtext}
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {membershipPlans.map((plan) => (
                <article
                  key={plan.title}
                  className="flex h-full flex-col rounded-2xl border border-[#D8C7B5] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3
                      className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {plan.title}
                    </h3>

                    <span className="rounded-full border border-[#D8C7B5] bg-[#F8F5F0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]">
                      {plan.duration}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {"price" in plan ? (
                      <p
                        className="text-3xl font-bold text-[#C6A56B]"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        {plan.price}
                      </p>
                    ) : null}

                    {"original" in plan && plan.original ? (
                      <span className="text-sm font-semibold text-[#B8A89A] line-through decoration-[1.5px] dark:text-[#8A7D75]">
                        {plan.original}
                      </span>
                    ) : null}

                    {"badge" in plan && plan.badge ? (
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                          plan.title === membershipContent.signature.title
                            ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-300"
                            : "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#C6A56B] dark:text-[#141210]"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-3 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]"
                      >
                        <Check className="mt-1 h-4 w-4 shrink-0 text-[#C6A56B]" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex-1" />

                  {"disabled" in plan && plan.disabled ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md border border-[#D8C7B5] bg-[#F4EFE8] px-5 text-sm font-medium text-[#8C7967] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                    >
                      {plan.button}
                    </button>
                  ) : "link" in plan ? (
                    <Link
                      href={plan.link}
                      className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                    >
                      {plan.button}
                    </Link>
                  ) : null
                  }
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F8F5F0] px-6 py-12 dark:bg-[#141210]">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {howItWorksContent.heading}
              </h2>
            </div>

            <div className="mt-10 flex flex-col gap-0 lg:flex-row lg:items-stretch">
              {howItWorksContent.steps.map((step, index) => (
                <div
                  key={step.n}
                  className="relative flex flex-col pl-8 lg:min-w-0 lg:flex-1 lg:pl-0"
                >
                  {index < howItWorksContent.steps.length - 1 ? (
                    <div className="absolute bottom-0 left-[18px] top-12 w-px bg-[#C6A56B] lg:hidden" />
                  ) : null}

                  <article className="relative pb-8 lg:pb-0">
                    <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#C6A56B] text-sm font-semibold text-[#2B2B2B] lg:static lg:mx-auto lg:h-12 lg:w-12 lg:text-base">
                      {step.n}
                    </div>

                    <div className="lg:px-4 lg:text-center">
                      <h3
                        className="ml-2 text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] lg:ml-0 lg:mt-5"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        {step.title}
                      </h3>
                      <p className="ml-2 mt-3 text-sm leading-7 text-[#B8A89A] dark:text-[#8A7D75] lg:ml-0">
                        {step.desc}
                      </p>
                    </div>
                  </article>

                  {index < howItWorksContent.steps.length - 1 ? (
                    <div className="hidden lg:flex lg:flex-1 lg:items-start lg:px-2">
                      <div className="mt-6 h-px w-full" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#2B2B2B] px-6 py-12 dark:bg-[#0F0D0C]">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-semibold text-[#F8F5F0] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {videoContent.heading}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#B8A89A] dark:text-[#8A7D75]">
                {videoContent.subtext}
              </p>
            </div>

            <div className="mx-auto mt-10 w-full max-w-4xl overflow-hidden rounded-xl">
              <iframe
                src={LANDING_VIDEO_URL}
                title="Selenite Care consultation video"
                className="aspect-video w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <section className="bg-[#F8F5F0] px-6 py-12 dark:bg-[#141210]">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {doctorsContent.heading}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                {doctorsContent.subtext}
              </p>
            </div>

            {isLoadingDoctors ? (
              <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-[#D8C7B5] bg-white px-4 py-6 text-center dark:border-[#3D3530] dark:bg-[#242220]"
                  >
                    <div className="mx-auto h-[120px] w-[120px] animate-pulse rounded-full bg-[#EFE7DC] dark:bg-[#1A1814]" />
                    <div className="mx-auto mt-4 h-5 w-24 animate-pulse rounded bg-[#EFE7DC] dark:bg-[#1A1814]" />
                    <div className="mx-auto mt-3 h-4 w-20 animate-pulse rounded bg-[#EFE7DC] dark:bg-[#1A1814]" />
                    <div className="mx-auto mt-4 h-7 w-24 animate-pulse rounded-full bg-[#EFE7DC] dark:bg-[#1A1814]" />
                  </div>
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <p className="mt-10 text-center text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                {noDoctorsMessage}
              </p>
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
                {doctors.map((doctor) => (
                  <article
                    key={doctor.id}
                    className="rounded-2xl border border-[#D8C7B5] bg-white px-4 py-6 text-center dark:border-[#3D3530] dark:bg-[#242220]"
                  >
                    {doctor.image ? (
                      <div className="relative mx-auto h-[120px] w-[120px] overflow-hidden rounded-full border-2 border-[#C6A56B]">
                        <Image
                          src={doctor.image}
                          alt={doctor.name}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full border-2 border-[#C6A56B] bg-[#EFE7DC] dark:bg-[#1A1814]">
                        <span
                          className="text-2xl font-semibold text-[#C6A56B]"
                          style={{ fontFamily: "Playfair Display, serif" }}
                        >
                          {getInitials(doctor.name)}
                        </span>
                      </div>
                    )}

                    <h3 className="mt-4 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {doctor.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
                      {doctor.designation}
                    </p>
                    <span className="mt-4 inline-flex rounded-full bg-[#C6A56B] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2B2B2B]">
                      {getSpecializationLabel(language, doctor.specialization)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#D8C7B5] px-6 py-12 dark:bg-[#221d1a]">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {testimonialsContent.heading}
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonialsContent.items.map((item) => (
                <article
                  key={`${item.name}-${item.concern}`}
                  className="flex h-full flex-col rounded-2xl border border-[#D8C7B5] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]"
                >
                  <div className="text-4xl leading-none text-[#C6A56B]">"</div>

                  <p className="mt-4 flex-1 text-sm italic leading-7 text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {item.text}
                  </p>

                  <div className="mt-6">
                    <p className="text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {item.name}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-[#F8F5F0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C7967] dark:bg-[#1A1814] dark:text-[#8A7D75]">
                      {item.concern}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F8F5F0] px-6 py-12 dark:bg-[#141210]">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {faqContent.heading}
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {faqItems.map((item) => {
                const isOpen = openFaqId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`overflow-hidden rounded-2xl border bg-white transition-colors dark:bg-[#242220] ${
                      isOpen
                        ? "border-[#C6A56B] dark:border-[#C6A56B]"
                        : "border-[#D8C7B5] dark:border-[#3D3530]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqId((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`mt-1 h-5 w-1 shrink-0 rounded-full ${
                            isOpen ? "bg-[#C6A56B]" : "bg-transparent"
                          }`}
                        />
                        <span className="text-sm font-medium leading-7 text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-base">
                          {item.question}
                        </span>
                      </div>

                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#C6A56B] transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen ? (
                      <div className="border-t border-[#D8C7B5] px-5 py-4 dark:border-[#3D3530] sm:px-6">
                        <p className="text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                          {item.answer}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#2B2B2B] px-6 py-12 dark:bg-[#0F0D0C]">
          <div className="mx-auto w-full max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A56B] sm:text-sm">
              {registrationContent.label}
            </p>

            <h2
              className="mt-4 text-3xl font-semibold text-[#F8F5F0] sm:text-4xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {registrationContent.heading}
            </h2>

            <p className="mt-4 text-base leading-7 text-[#B8A89A] dark:text-[#8A7D75]">
              {registrationContent.subtext}
            </p>

            <button
              type="button"
              onClick={openRegisterModal}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#C6A56B] px-6 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#D4B47A]"
            >
              {registrationContent.openButton}
            </button>
          </div>
        </section>

        <section className="bg-[#F8F5F0] px-6 py-12 dark:bg-[#141210]">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {contactContent.heading}
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <article className="flex flex-col rounded-2xl border border-[#D8C7B5] bg-white p-6 text-center dark:border-[#3D3530] dark:bg-[#242220]">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F5F0] text-[#C6A56B] dark:bg-[#1A1814]">
                  <Phone className="h-5 w-5" />
                </div>
                <p className="mt-5 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {contactContent.card1Label}
                </p>
                <p
                  className="mt-3 text-2xl font-semibold text-[#C6A56B]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  +880 1647-660300
                </p>
                <a
                  href="tel:+8801647660300"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#3A3734]"
                >
                  {contactButtonLabels.callNow}
                </a>
              </article>

              <article className="flex flex-col rounded-2xl border border-[#D8C7B5] bg-white p-6 text-center dark:border-[#3D3530] dark:bg-[#242220]">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F5F0] text-[#C6A56B] dark:bg-[#1A1814]">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="mt-5 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {contactContent.card2Label}
                </p>
                <p
                  className="mt-3 text-2xl font-semibold text-[#C6A56B]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  +880 1647-660300
                </p>
                <a
                  href="https://wa.me/8801647660300"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-[#25D366] px-5 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  {contactButtonLabels.whatsappNow}
                </a>
              </article>

              <article className="flex flex-col rounded-2xl border border-[#D8C7B5] bg-white p-6 text-center dark:border-[#3D3530] dark:bg-[#242220]">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F5F0] text-[#C6A56B] dark:bg-[#1A1814]">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <p className="mt-5 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {contactContent.card3Label}
                </p>
                <p
                  className="mt-3 text-2xl font-semibold text-[#C6A56B]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  @care.selenite
                </p>
                <a
                  href="https://www.facebook.com/care.selenite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-[#1877F2] px-5 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  {contactButtonLabels.visitPage}
                </a>
              </article>
            </div>
            <div>
              <center>
            <a
              href="tel:+8801647660300"
              className="mx-auto mt-8 inline-flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-md bg-[#C6A56B] px-6 text-lg font-bold text-[#2B2B2B] transition-colors hover:bg-[#D4B47A]"
            >
              <Phone className="h-5 w-5" />
              <span>{contactContent.bigButton}</span>
            </a>
            </center>
          </div>
          </div>
        </section>

        <footer className="bg-[#2B2B2B] px-6 py-6 pb-20 dark:bg-[#0F0D0C] md:pb-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-sm text-[#B8A89A] dark:text-[#8A7D75]">
              {footerContent.copyright}
            </p>

            <div className="flex items-center gap-5">
              <a
                href="https://www.facebook.com/care.selenite"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-[#C6A56B] transition-opacity hover:opacity-80"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/_selenite_care_/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-[#C6A56B] transition-opacity hover:opacity-80"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5ZM17.5 6.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
                </svg>
              </a>

              <a
                href="https://wa.me/8801647660300"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-[#C6A56B] transition-opacity hover:opacity-80"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                </svg>
              </a>

              <a
                href="tel:+8801647660300"
                aria-label="Phone"
                className="text-[#C6A56B] transition-opacity hover:opacity-80"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </footer>

        {showRegisterModal ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6"
            onClick={closeRegisterModal}
          >
            <div
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] border border-[#D8C7B5] bg-[#F8F5F0] p-6 shadow-2xl dark:border-[#3D3530] dark:bg-[#181513]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A56B]">
                    {registrationContent.label}
                  </p>
                  <h3
                    className="mt-3 text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {registeredEmail
                      ? registrationContent.successTitle
                      : registrationContent.modalTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                    {registeredEmail
                      ? `${registrationContent.successPrefix} ${registeredEmail}${registrationContent.successSuffix}`
                      : registrationContent.modalSubtext}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRegisterModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D8C7B5] bg-white text-lg text-[#2B2B2B] transition-colors hover:bg-[#F3EEE6] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:hover:bg-[#242220]"
                  aria-label={registrationContent.closeButton}
                >
                  ×
                </button>
              </div>

              <div className="mt-6">
                {registeredEmail ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending || resendCountdown > 0}
                      className={`inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
                        isResending || resendCountdown > 0
                          ? "cursor-not-allowed bg-[#D8C7B5] text-[#6E6257] opacity-80 dark:bg-[#3D3530] dark:text-[#8A7D75]"
                          : "bg-[#2B2B2B] text-[#F8F5F0] hover:bg-[#3A3734] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                      }`}
                    >
                      {isResending
                        ? registrationContent.resendSending
                        : resendCountdown > 0
                          ? `${registrationContent.resendButton} (${resendCountdown}s)`
                          : registrationContent.resendButton}
                    </button>

                    {resendSuccess ? (
                      <p className="text-sm text-[#8A6A2F] dark:text-[#D4B47A]">
                        {resendSuccess}
                      </p>
                    ) : null}

                    {resendError ? (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {resendError}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="landing-register-name"
                        className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                      >
                        {registrationContent.nameLabel}
                      </label>
                      <input
                        id="landing-register-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        className="h-12 w-full rounded-md border border-[#D8C7B5] bg-white px-4 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="landing-register-phone"
                        className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                      >
                        {registrationContent.phoneLabel}
                      </label>
                      <div className="brand-phone-input-wrapper">
                        <PhoneInput
                          id="landing-register-phone"
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="BD"
                          value={registerPhone}
                          onChange={(value) => setRegisterPhone(value ?? "")}
                          numberInputProps={{
                            autoComplete: "tel",
                            required: true,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="landing-register-email"
                        className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                      >
                        {registrationContent.emailLabel}
                      </label>
                      <input
                        id="landing-register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="h-12 w-full rounded-md border border-[#D8C7B5] bg-white px-4 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="landing-register-dob"
                        className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                      >
                        {registrationContent.dobLabel}
                      </label>
                      <input
                        id="landing-register-dob"
                        name="dateOfBirth"
                        type="date"
                        className="h-12 w-full rounded-md border border-[#D8C7B5] bg-white px-4 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="landing-register-password"
                        className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                      >
                        {registrationContent.passwordLabel}
                      </label>
                      <input
                        id="landing-register-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="h-12 w-full rounded-md border border-[#D8C7B5] bg-white px-4 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                      />
                    </div>

                    {showExistingAccountNotice ? (
                      <div className="rounded-xl border border-[#C6A56B] bg-[#F8F5F0] px-4 py-3 dark:bg-[#242220]">
                        <p className="text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                          {registrationContent.existingAccount}
                        </p>
                      </div>
                    ) : null}

                    {registerError ? (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {registerError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSubmittingRegister}
                      className={`inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
                        isSubmittingRegister
                          ? "cursor-not-allowed bg-[#D8C7B5] text-[#6E6257] opacity-80 dark:bg-[#3D3530] dark:text-[#8A7D75]"
                          : "bg-[#2B2B2B] text-[#F8F5F0] hover:bg-[#3A3734] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                      }`}
                    >
                      {isSubmittingRegister
                        ? registrationContent.submittingButton
                        : registrationContent.submitButton}
                    </button>

                    <p className="text-center text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                      {registrationContent.loginPrompt}{" "}
                      <Link
                        href="/login"
                        className="text-[#2B2B2B] underline transition-opacity hover:opacity-80 dark:text-[#F0EDE8]"
                      >
                        {registrationContent.loginLink}
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-3 border-t border-[#3D3530] bg-[#2B2B2B] md:hidden dark:bg-[#0F0D0C]">
          <a
            href="tel:+8801647660300"
            className="flex min-h-[60px] flex-col items-center justify-center gap-1 px-2 py-2 text-[#C6A56B]"
          >
            <Phone className="h-4 w-4" />
            <span className="text-xs font-medium">
              {contactButtonLabels.mobileCall}
            </span>
          </a>

          <a
            href="https://wa.me/8801647660300"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[60px] flex-col items-center justify-center gap-1 px-2 py-2 text-[#25D366]"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">
              {contactButtonLabels.mobileWhatsApp}
            </span>
          </a>

          <Link
            href="/services"
            className="flex min-h-[60px] flex-col items-center justify-center gap-1 bg-[#C6A56B] px-2 py-2 text-[#2B2B2B]"
          >
            <Star className="h-4 w-4 fill-current" />
            <span className="text-xs font-semibold">
              {headerContent.joinButton}
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
