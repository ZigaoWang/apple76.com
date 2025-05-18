import Link from 'next/link';

export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">About Apple76.com</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Welcome to Apple76.com, a digital archive dedicated to preserving and sharing Apple&apos;s rich history through vintage manuals, advertisements, and rare memorabilia.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              Our mission is to create a comprehensive digital library that documents Apple&apos;s journey from its early days to the present. We believe in preserving these historical materials for future generations and making them accessible to researchers, enthusiasts, and the general public.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">The Collection</h2>
            <p className="text-gray-600 mb-6">
              Our collection includes:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Vintage product manuals and documentation</li>
              <li>Historical advertisements and marketing materials</li>
              <li>Rare photographs and memorabilia</li>
              <li>Technical specifications and brochures</li>
              <li>User guides and software documentation</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contribute</h2>
            <p className="text-gray-600 mb-6">
              We welcome contributions from the community. If you have historical Apple materials that you&apos;d like to share, please contact us. All contributions are carefully curated and properly credited.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Disclaimer</h2>
            <p className="text-gray-600 mb-6">
              Apple76.com is an independent project and is not affiliated with Apple Inc. All materials are shared for historical and educational purposes. All trademarks and copyrights belong to their respective owners.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-gray-500 text-sm">
                  © {new Date().getFullYear()} Apple76.com. All rights reserved.
                </p>
                <Link 
                  href="/"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 