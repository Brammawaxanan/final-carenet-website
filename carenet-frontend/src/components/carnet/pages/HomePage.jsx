import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Users, Clock, Shield, Star, Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';
import PublicNavigation from '../components/PublicNavigation';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');

  const handleFindCare = (e) => {
    e.preventDefault();
    navigate('/service');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicNavigation />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-600"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Compassionate<br />
                <span className="text-amber-400">In-Home Care Services</span>
              </h1>
              
              <p className="text-xl text-blue-100">
                Find a qualified caregiver near you:
              </p>

              {/* Search Form */}
              <form onSubmit={handleFindCare} className="bg-white rounded-lg p-2 flex gap-2 shadow-xl">
                <input
                  type="text"
                  placeholder="Where is care needed?"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="flex-1 px-4 py-3 text-gray-800 outline-none rounded"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition shadow-lg"
                >
                  Find Care
                </button>
              </form>

              <p className="text-sm text-blue-200">
                Available 24/7 · Trusted by thousands of families
              </p>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&auto=format&fit=crop"
                  alt="Caregiver with elderly person"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent"></div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">98%</div>
                  <div className="text-xs text-gray-500">Satisfaction Rate</div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">2,500+</div>
                  <div className="text-xs text-gray-500">Caregivers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              America's Choice in Home Care
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              If you're looking for professional help at home to assist your aging loved one with their daily needs, 
              look no further than CareNet—a trusted platform connecting families with qualified caregivers since 2024.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Verified Caregivers</h3>
              <p className="text-gray-600">
                All our caregivers undergo thorough background checks and verification processes to ensure your safety and peace of mind.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">24/7 Availability</h3>
              <p className="text-gray-600">
                Find caregivers available for day, night, weekend, or live-in care. Flexible scheduling to meet your needs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Top Rated Service</h3>
              <p className="text-gray-600">
                Rated 4.9/5 stars by thousands of satisfied families. Read real reviews from people in your community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop"
                alt="Care services"
                className="rounded-2xl shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">
                Comprehensive Care Services
              </h2>
              <div className="space-y-4">
                {[
                  'Personal Care & Hygiene',
                  'Medication Reminders',
                  'Meal Preparation',
                  'Light Housekeeping',
                  'Transportation & Errands',
                  'Companionship',
                  'Specialized Dementia Care',
                  'Post-Hospital Care'
                ].map((service, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/service')}
                className="mt-8 px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition shadow-lg"
              >
                Browse Caregivers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-sky-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to find the perfect caregiver</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Search & Browse',
                desc: 'Search for caregivers in your area. Filter by skills, experience, and availability.',
                icon: Search
              },
              {
                step: '2',
                title: 'Review Profiles',
                desc: 'Read reviews, check credentials, and compare rates. Contact caregivers directly.',
                icon: Users
              },
              {
                step: '3',
                title: 'Start Care',
                desc: 'Schedule services, manage tasks, and track progress all from your dashboard.',
                icon: CheckCircle
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                  <div className="inline-flex w-16 h-16 bg-sky-600 text-white rounded-full items-center justify-center text-2xl font-bold mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-sky-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-sky-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Find Your Perfect Caregiver?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of families who trust CareNet for their home care needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/service')}
              className="px-10 py-4 bg-white text-sky-600 hover:bg-gray-100 font-bold rounded-lg transition shadow-lg text-lg"
            >
              Find Care Now
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition shadow-lg text-lg"
            >
              Become a Caregiver
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold">CareNet</span>
              </div>
              <p className="text-gray-400">
                Connecting families with qualified caregivers since 2024.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#services" className="hover:text-white transition">Services</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">For Caregivers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Join Our Network</a></li>
                <li><a href="#" className="hover:text-white transition">Caregiver Resources</a></li>
                <li><a href="#" className="hover:text-white transition">Training</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Contact Us</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>800-CARENET</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@carenet.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Nationwide Service</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CareNet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
