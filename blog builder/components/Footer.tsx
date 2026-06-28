
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
      <p>&copy; {new Date().getFullYear()} BlogGenius AI. All rights reserved.</p>
      {/* AdSense placeholder */}
      <div id="adsense-slot-footer" className="mt-4">
          {/* Future Google AdSense script will populate this div */}
      </div>
    </footer>
  );
};

export default Footer;
