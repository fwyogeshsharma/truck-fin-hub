import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  HelpCircle,
  BookOpen,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Cookie
} from "lucide-react";
import { resetCookieConsent } from "./CookieConsent";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">About LogiFin</h3>
            <p className="text-sm text-muted-foreground">
              LogiFin is a comprehensive logistics financing platform connecting transporters,
              lenders, and load owners for seamless trip financing and investment opportunities.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Help & Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Help & Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/help/getting-started"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Getting Started Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/help/user-manual"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  User Manual
                </Link>
              </li>
              <li>
                <Link
                  to="/help/faq"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  to="/help/video-tutorials"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Video Tutorials
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-conditions"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@rollingradius.com"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  support@rollingradius.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+919024822434"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  +91 90248-22434
                </a>
              </li>
              <li className="text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Support Hours:</p>
                    <p className="text-xs">Mon-Fri: 9:00 AM - 6:00 PM IST</p>
                    <p className="text-xs">Sat: 10:00 AM - 4:00 PM IST</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Address & Office */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Registered Office</h3>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground flex gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>121 - 122, Metropolis Tower</p>
                  <p>Purani Chungi, Ajmer Road</p>
                  <p>Jaipur-302019</p>
                  <p>Rajasthan, India</p>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="https://www.google.com/maps/dir//Manglam+Metropolis+Tower,+238,+Purani+Chungi,+Panchsheel+Colony,+Jaipur,+Rajasthan+302019/@26.8960422,75.6733714,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x396db48beb718be7:0x403ceb9d0f59d3f5!2m2!1d75.7557729!2d26.8960661?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View on Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} LogiFin. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                to="/terms-conditions"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/cookie-policy"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Cookies
              </Link>
              <button
                onClick={resetCookieConsent}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <Cookie className="h-3 w-3" />
                Cookie Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
