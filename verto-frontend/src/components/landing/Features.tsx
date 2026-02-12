import {
  RiExchangeFundsLine,
  RiEyeOffLine,
  RiShieldCheckLine,
  RiFileTextLine,
} from 'react-icons/ri';

const FEATURES = [
  {
    icon: RiExchangeFundsLine,
    title: 'Zero Fees',
    description:
      'No intermediaries taking a cut. Payments flow directly from client to your wallet, keeping every satoshi.',
  },
  {
    icon: RiEyeOffLine,
    title: 'Privacy First',
    description:
      'Your financial data stays yours. No surveillance, no third-party access, no data to breach or subpoena.',
  },
  {
    icon: RiShieldCheckLine,
    title: 'Smart Escrow',
    description:
      'Trustless payment protection powered by Clarity smart contracts on Bitcoin. No middlemen, no disputes.',
  },
  {
    icon: RiFileTextLine,
    title: 'Professional Invoices',
    description:
      'Generate beautiful PDF invoices with Bitcoin QR codes, automatic numbering, and real-time payment tracking.',
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative px-4 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-500">
            Features
          </p>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Everything you need to get paid
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
            Professional invoicing meets Bitcoin self-custody. Built for
            freelancers who value their sovereignty.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-orange-500/30"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition-colors group-hover:bg-orange-100 dark:bg-orange-500/10 dark:group-hover:bg-orange-500/20">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
