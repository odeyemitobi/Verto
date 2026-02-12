import {
  RiFileAddLine,
  RiShareLine,
  RiBitCoinLine,
} from 'react-icons/ri';

const STEPS = [
  {
    number: '01',
    icon: RiFileAddLine,
    title: 'Create Invoice',
    description:
      'Fill in client details, add line items, set your Bitcoin payment address, and generate a professional PDF.',
  },
  {
    number: '02',
    icon: RiShareLine,
    title: 'Share & Escrow',
    description:
      'Send the invoice to your client. For extra protection, set up a trustless escrow smart contract.',
  },
  {
    number: '03',
    icon: RiBitCoinLine,
    title: 'Get Paid',
    description:
      'Receive Bitcoin directly in your wallet. Track payments in real-time from your dashboard.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative px-4 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-500">
            How It Works
          </p>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Three steps to sovereign payments
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
            From invoice to payment in minutes. No sign-ups, no KYC, no
            middlemen.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-8 md:grid-cols-3 md:gap-12">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-16 hidden h-px bg-linear-to-r from-transparent via-gray-200 to-transparent md:block dark:via-neutral-700" />

          {STEPS.map((step) => (
            <div key={step.number} className="relative text-center">
              {/* Step icon */}
              <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-orange-200 bg-white dark:border-orange-500/30 dark:bg-neutral-900">
                <step.icon className="h-7 w-7 text-orange-500" />
              </div>

              {/* Number */}
              <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-orange-500">
                Step {step.number}
              </span>

              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
