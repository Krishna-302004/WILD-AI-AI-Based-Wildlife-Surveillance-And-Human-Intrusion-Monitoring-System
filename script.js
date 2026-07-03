// ===================================
// Global Variables
// ===================================
let currentUser = null;
let detectionInterval = null;
let currentLanguage = 'en';

let lastPopupTime = 0;
let lastPopupSpecies = "";
let currentDetectionData = null;
let autoSmsEnabled = localStorage.getItem('autoSms') === 'true';
let autoSoundEnabled = localStorage.getItem('autoSound') === 'true';

function handleAutoToggle(type) {
    if (type === 'sms') {
        autoSmsEnabled = document.getElementById('toggleAutoSms').checked;
        localStorage.setItem('autoSms', autoSmsEnabled);
        showNotification(`Auto-SMS ${autoSmsEnabled ? 'Enabled' : 'Disabled'}`, 'info');
    } else if (type === 'sound') {
        autoSoundEnabled = document.getElementById('toggleAutoSound').checked;
        localStorage.setItem('autoSound', autoSoundEnabled);
        showNotification(`Auto-Sound ${autoSoundEnabled ? 'Enabled' : 'Disabled'}`, 'info');
    }
}

// ===================================
// Notification System
// ===================================
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');
  notification.className = `alert alert-${type}`;
  notification.style.cssText = `
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-md);
    background: var(--color-surface-dark);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    color: white;
    min-width: 300px;
    animation: slideIn 0.3s ease-out forwards;
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  let icon = 'i';
  if (type === 'safe' || type === 'success') {
    icon = '✓';
    notification.style.borderColor = 'var(--color-safe)';
  } else if (type === 'danger' || type === 'warning' || type === 'error') {
    icon = '!';
    notification.style.borderColor = 'var(--color-danger-high)';
  }

  notification.innerHTML = `
    <span style="font-size: 1.25rem;">${icon}</span>
    <div style="flex: 1;">${message}</div>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; opacity: 0.6; padding: 4px;">✕</button>
  `;

  container.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Add animation styles
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ===================================
// Language Translations
// ===================================
const translations = {
  en: {
    'brand': 'WildAI',
    'nav-home': 'Home',
    'nav-features': 'Features',
    'nav-about': 'About',
    'nav-portal': 'User Portal',
    'nav-admin': 'Admin Login',
    'hero-title': 'Protecting Lives, Preserving Wildlife',
    'hero-desc': 'AI-driven smart fencing and real-time monitoring to minimize human-wildlife conflict through intelligent detection, species identification, and predictive analytics.',
    'btn-report': 'Report Sighting',
    'btn-admin': 'Admin Access',
    'stat-detections': 'Wildlife Detections',
    'stat-prevented': 'Conflicts Prevented',
    'stat-accuracy': 'Detection Accuracy',
    'stat-monitoring': 'Active Monitoring',
    'features-title': 'Intelligent Protection System',

    // Feature Cards
    'f1-title': 'Real-Time Detection',
    'f1-desc': 'Advanced AI algorithms continuously monitor boundary zones, detecting wildlife movement and unauthorized human intrusion with 98.5% accuracy.',
    'f1-item1': '24/7 automated surveillance',
    'f1-item2': 'Multi-sensor integration',
    'f1-item3': 'Instant alert generation',

    'f2-title': 'Species Classification',
    'f2-desc': 'Behavioral pattern analysis evaluates movement speed, gestures, and acoustic signals to accurately identify species and assess danger levels.',
    'f2-item1': 'Movement pattern recognition',
    'f2-item2': 'Acoustic signal analysis',
    'f2-item3': 'Risk-based classification',

    'f3-title': 'Species-Specific Alerts',
    'f3-desc': 'Customized warning systems activate different alarm sounds and intensities based on animal danger level - from high-risk tigers to lower-risk wild boars.',
    'f3-item1': 'Graduated response system',
    'f3-item2': 'Multi-level alarm intensity',
    'f3-item3': 'Targeted notifications',

    'f4-title': 'Anti-Poaching Detection',
    'f4-desc': 'Identifies illegal human entry and potential poaching activities, immediately notifying forest authorities with location data and visual evidence.',
    'f4-item1': 'Unauthorized entry detection',
    'f4-item2': 'Automatic authority alerts',
    'f4-item3': 'Evidence documentation',

    'f5-title': 'Verified Community Reports',
    'f5-desc': 'Mobile app enables villagers to report wildlife sightings with AI-powered image authenticity verification to prevent false or manipulated reports.',
    'f5-item1': 'Easy image upload',
    'f5-item2': 'AI tamper detection',
    'f5-item3': 'Community engagement',

    'f6-title': 'Emergency SOS System',
    'f6-desc': 'Instant emergency alerts with dynamic escape route guidance based on real-time wildlife locations and safe zone mapping.',
    'f6-item1': 'One-touch emergency alert',
    'f6-item2': 'GPS-based routing',
    'f6-item3': 'Real-time safe zones',

    'f7-title': 'Predictive Analytics',
    'f7-desc': 'Seasonal and environmental analysis based on crop cycles, water scarcity, and historical data to predict animal movement trends.',
    'f7-item1': 'Seasonal pattern analysis',
    'f7-item2': 'Environmental correlation',
    'f7-item3': 'Movement forecasting',

    'f8-title': 'Behavioral Intelligence',
    'f8-desc': 'Machine learning models continuously improve detection accuracy by analyzing animal behavior patterns and adapting to new threats.',
    'f8-item1': 'Continuous learning',
    'f8-item2': 'Pattern adaptation',
    'f8-item3': 'Threat evolution tracking',

    'f9-title': 'Conservation Management',
    'f9-desc': 'Comprehensive data collection supports wildlife management strategies and conservation efforts through detailed movement and behavior insights.',
    'f9-item1': 'Population tracking',
    'f9-item2': 'Habitat analysis',
    'f9-item3': 'Conservation insights',

    // About Section
    'about-title': 'About the Project',
    'about-desc1': 'Human-wildlife conflict is an increasing challenge in forest-border regions, resulting in risks to human life, agricultural loss, and threats to wildlife conservation.',
    'about-desc2': 'Our AI-driven smart fencing and monitoring system provides a comprehensive solution through:',
    'about-item1': 'Real-time monitoring',
    'about-item1-desc': 'of wildlife movement and human intrusion',
    'about-item2': 'Behavioral intelligence',
    'about-item2-desc': 'for accurate species identification',
    'about-item3': 'Predictive analytics',
    'about-item3-desc': 'to forecast animal movement patterns',
    'about-item4': 'Community engagement',
    'about-item4-desc': 'through verified reporting systems',
    'about-item5': 'Emergency response',
    'about-item5-desc': 'with SOS alerts and escape guidance',
    'about-desc3': 'Through the integration of cutting-edge technology and conservation science, we aim to create a harmonious coexistence between humans and wildlife while supporting effective wildlife management strategies.',

    'cap-title': 'System Capabilities',
    'cap-species': 'Species Identified',
    'cap-area': 'Coverage Area',
    'cap-response': 'Alert Response Time',
    'cap-users': 'Active Users',

    // How it works
    'how-title': 'How It Works',
    'how-step1-title': 'Detection',
    'how-step1-desc': 'AI sensors detect movement within monitored boundaries using thermal, visual, and acoustic analysis.',
    'how-step2-title': 'Identification',
    'how-step2-desc': 'Behavioral patterns and physical characteristics are analyzed to identify species and assess threat level.',
    'how-step3-title': 'Response',
    'how-step3-desc': 'Species-specific alerts are activated with appropriate alarm intensity and notification protocols.',
    'how-step4-title': 'Prevention',
    'how-step4-desc': 'Intelligent fencing and authority notifications prevent human-wildlife conflict before it escalates.',

    // User Portal
    'portal-desc1': 'Report wildlife sightings, access safety resources, and stay informed about wildlife activity in your area.',
    'alerts-title': 'Active Alerts in Your Area',
    'animal-count-label': 'Number of Animals',
    'behavior-label': 'Observed Behavior',
    'behavior-placeholder': 'Describe what the animal(s) were doing...',
    'upload-photo-label': 'Upload Photo (Required for verification)',
    'upload-click': 'Click to upload image',
    'upload-format': 'PNG, JPG up to 10MB',
    'recent-reports-title': 'Recent Community Reports',

    // Safety Guidelines
    'safety-guidelines-title': 'Safety Guidelines',
    'guideline-dangerous-wildlife-title': 'If You Encounter Dangerous Wildlife',
    'guideline-dangerous-wildlife-1': 'Stay calm and do not run',
    'guideline-dangerous-wildlife-2': 'Back away slowly while facing the animal',
    'guideline-dangerous-wildlife-3': 'Make yourself appear larger by raising your arms',
    'guideline-dangerous-wildlife-4': 'Do not make direct eye contact with predators',
    'guideline-dangerous-wildlife-5': 'Use the SOS button immediately for emergency help',
    'guideline-dangerous-wildlife-6': 'Make noise to alert others in the area',

    'guideline-sos-system-title': 'Using the SOS System',
    'guideline-sos-system-1': 'Press the SOS button in bottom-right corner',
    'guideline-sos-system-2': 'Your location is automatically shared',
    'guideline-sos-system-3': 'Forest authorities are notified immediately',
    'guideline-sos-system-4': 'Follow escape route guidance on screen',
    'guideline-sos-system-5': 'Stay on the line if contacted by authorities',
    'guideline-sos-system-6': 'Move to nearest safe zone as indicated',

    'guideline-agricultural-protection-title': 'Agricultural Protection Tips',
    'guideline-agricultural-protection-1': 'Install proper fencing around crop areas',
    'guideline-agricultural-protection-2': 'Use motion-activated lights as deterrents',
    'guideline-agricultural-protection-3': 'Harvest crops promptly to reduce attraction',
    'guideline-agricultural-protection-4': 'Store produce securely away from forest edges',
    'guideline-agricultural-protection-5': 'Report crop damage to authorities',
    'guideline-agricultural-protection-6': 'Coordinate with neighbors for community watch',

    'guideline-community-safety-title': 'Community Safety Measures',
    'guideline-community-safety-1': 'Travel in groups during high-risk times',
    'guideline-community-safety-2': 'Avoid forest areas at dawn and dusk',
    'guideline-community-safety-3': 'Keep children supervised near forest borders',
    'guideline-community-safety-4': 'Secure livestock in protected enclosures',
    'guideline-community-safety-5': 'Share sightings with community members',
    'guideline-community-safety-6': 'Participate in awareness programs',

    // SOS Modal in User Portal
    'sos-activated-title': 'EMERGENCY SOS ACTIVATED',
    'sos-location-shared': 'Your location has been shared',
    'sos-authorities-notified': 'Forest authorities notified',
    'sos-help-on-way': 'Help is on the way. Stay calm and follow safety guidelines.',
    'sos-safe-zone-title': 'Nearest Safe Zone',
    'sos-direction': 'Direction',
    'sos-distance': 'Distance',
    'sos-follow-direction': 'Follow this direction to reach safety',
    'sos-call-emergency': 'Call Emergency (100)',
    'sos-close': 'Close',

    // Emergency SOS Page
    'emergency-banner': 'Emergency Response & Wildlife Reporting System',
    'sos-title': 'Emergency SOS',
    'sos-subtitle': 'Immediate help for wildlife encounters',
    'sos-ready': 'Ready for Emergency',
    'sos-ready-desc': 'Press the button below if you encounter dangerous wildlife or need immediate assistance.',
    'activate-sos': 'ACTIVATE EMERGENCY SOS',
    'sos-warning-title': 'When to use SOS:',
    'sos-warning-desc': 'Dangerous wildlife encounter, injury, or immediate threat to life. False alarms may result in penalties.',
    'sos-activated': 'EMERGENCY SOS ACTIVATED',
    'location-shared': 'Your location has been shared',
    'acquiring-gps': 'Acquiring GPS coordinates...',
    'authorities-notified': 'Forest authorities notified',
    'help-coming': 'Help is on the way. Stay calm and follow safety guidelines.',
    'nearest-safe-zone': 'Nearest Safe Zone',
    'direction': 'Direction',
    'distance': 'Distance',
    'follow-direction': 'Follow this direction to reach safety',
    'deactivate-sos': 'Deactivate SOS',

    // Report Form
    'report-title': 'Report Wildlife Sighting',
    'report-subtitle': 'Help us track and protect wildlife',
    'location-label': 'Location',
    'location-placeholder': 'Enter location or use GPS',
    'use-gps': 'Use My Current Location',
    'date-label': 'Date',
    'time-label': 'Time',
    'species-label': 'Species (if known)',
    'select-species': 'Select species...',
    'species-tiger': 'Tiger / കടുവ',
    'species-leopard': 'Leopard / പുലി',
    'species-elephant': 'Elephant / ആന',
    'species-boar': 'Wild Boar / കാട്ടുപന്നി',
    'species-deer': 'Deer / മാൻ',
    'species-bear': 'Bear / കരടി',
    'species-monkey': 'Monkey / കുരങ്ങ്',
    'species-snake': 'Snake / പാമ്പ്',
    'species-other': 'Other',
    'species-unknown': 'Unknown',
    'upload-photo': 'Upload Photo (Required for verification)',
    'drag-drop': 'Drag & drop image here or click to browse',
    'file-types': 'PNG, JPG up to 10MB',
    'notes-label': 'Additional Notes',
    'notes-placeholder': 'Describe what you observed...',
    'contact-label': 'Your Contact Number (Optional)',
    'submit-report': 'Submit Report',

    // Footer
    'emergency-hotline': 'Emergency Hotline:',
    'footer-tagline': 'Protecting lives, preserving wildlife.',

    // Admin Login
    'admin-title': 'Forest Officer Login',
    'admin-subtitle': 'Access the admin dashboard',
    'officer-id-label': 'Officer ID',
    'officer-id-placeholder': 'Enter your officer ID',
    'password-label': 'Password',
    'password-placeholder': 'Enter your password',
    'remember-me': 'Remember me',
    'login-btn': 'Login to Dashboard',
    'demo-creds': 'Demo credentials:',
    'back-home': 'Back to Home',
    'assist-text': 'For assistance, contact: ',

    // Admin Portal
    'admin-dashboard': 'Dashboard',
    'admin-monitoring': 'Monitoring',
    'admin-reports': 'Reports',
    'admin-analytics': 'Analytics',
    'admin-logout': 'Logout',
    'admin-panel-title': 'Forest Officer Dashboard',
    'admin-panel-subtitle': 'Real-time wildlife monitoring and management system'
  },
  ml: {
    'brand': 'WildAI',
    'nav-home': 'ഹോം',
    'nav-features': 'സവിശേഷതകൾ',
    'nav-about': 'കുറിച്ച്',
    'nav-portal': 'ഉപയോക്തൃ പോർട്ടൽ',
    'nav-admin': 'അഡ്മിൻ പ്രവേശനം',
    'hero-title': 'ജീവൻ സംരക്ഷിക്കുന്നു, വന്യജീവികളെ സംരക്ഷിക്കുന്നു',
    'hero-desc': 'ബുദ്ധിപരമായ കണ്ടെത്തൽ, സ്പീഷീസ് തിരിച്ചറിയൽ, പ്രവചന വിശകലനം എന്നിവയിലൂടെ മനുഷ്യ-വന്യജീവി സംഘർഷം കുറയ്ക്കുന്നതിനുള്ള AI-നയിക്കുന്ന സ്മാർട്ട് ഫെൻസിംഗും തത്സമയ നിരീക്ഷണവും.',
    'btn-report': 'കാഴ്ച റിപ്പോർട്ട് ചെയ്യുക',
    'btn-admin': 'അഡ്മിൻ പ്രവേശനം',
    'stat-detections': 'വന്യജീവി കണ്ടെത്തലുകൾ',
    'stat-prevented': 'സംഘർഷങ്ങൾ തടഞ്ഞു',
    'stat-accuracy': 'കണ്ടെത്തൽ കൃത്യത',
    'stat-monitoring': 'സജീവ നിരീക്ഷണം',
    'features-title': 'ബുദ്ധിപരമായ സംരക്ഷണ സംവിധാനം',

    // Feature Cards
    'f1-title': 'തത്സമയ കണ്ടെത്തൽ',
    'f1-desc': 'അഡ്വാൻസ്ഡ് AI അൽഗോരിതങ്ങൾ അതിർത്തി മേഖലകളെ നിരന്തരം നിരീക്ഷിക്കുന്നു, 98.5% കൃത്യതയോടെ വന്യജീവികളുടെ ചലനവും അനധികൃത കടന്നുകയറ്റവും കണ്ടെത്തുന്നു.',
    'f1-item1': '24/7 ഓട്ടോമേറ്റഡ് നിരീക്ഷണം',
    'f1-item2': 'മൾട്ടി-സെൻസർ ഏകീകരണം',
    'f1-item3': 'തൽക്ഷണ അലേർട്ട് നൽകൽ',

    'f2-title': 'സ്പീഷീസ് വർഗ്ഗീകരണം',
    'f2-desc': 'ചലന വേഗത, ശബ്ദങ്ങൾ എന്നിവ വിശകലനം ചെയ്തുകൊണ്ട് വന്യജീവികളെ തിരിച്ചറിയുകയും അപകടസാധ്യത വിലയിരുത്തുകയും ചെയ്യുന്നു.',
    'f2-item1': 'ചലന പാറ്റേൺ തിരിച്ചറിയൽ',
    'f2-item2': 'ശബ്ദ സിഗ്നൽ വിശകലനം',
    'f2-item3': 'അപകടസാധ്യത അടിസ്ഥാനമാക്കിയുള്ള വർഗ്ഗീകരണം',

    'f3-title': 'സ്പീഷീസ് അടിസ്ഥാനമാക്കിയുള്ള അലേർട്ടുകൾ',
    'f3-desc': 'വന്യമൃഗങ്ങളുടെ അപകടസാധ്യത അനുസരിച്ച് വ്യത്യസ്തമായ അലാറം ശബ്ദങ്ങളും സന്ദേശങ്ങളും നൽകുന്നു.',
    'f3-item1': 'ഘട്ടം ഘട്ടമായ പ്രതികരണ സംവിധാനം',
    'f3-item2': 'മൾട്ടി-ലെവൽ അലാറം തീവ്രത',
    'f3-item3': 'കൃത്യമായ അറിയിപ്പുകൾ',

    'f4-title': 'വേട്ടയാടൽ തടയൽ',
    'f4-desc': 'അനധികൃത കടന്നുകയറ്റവും വേട്ടയാടൽ പ്രവർത്തനങ്ങളും കണ്ടെത്തുകയും ആ നിമിഷം തന്നെ വനം വകുപ്പ് അധികൃതരെ അറിയിക്കുകയും ചെയ്യുന്നു.',
    'f4-item1': 'അനധികൃത കടന്നുകയറ്റം കണ്ടെത്തൽ',
    'f4-item2': 'ഓട്ടോമാറ്റിക് അലേർട്ടുകൾ',
    'f4-item3': 'തെളിവുകൾ രേഖപ്പെടുത്തൽ',

    'f5-title': 'സ്ഥിരീകരിച്ച കമ്മ്യൂണിറ്റി رپورറ്റുകൾ',
    'f5-desc': 'വ്യാജ റിപ്പോർട്ടുകൾ തടയുന്നതിനായി AI ഉപയോഗിച്ച് ചിത്രങ്ങളുടെ ആധികാരികത പരിശോധിക്കാനുള്ള സംവിധാനം.',
    'f5-item1': 'എളുപ്പത്തിലുള്ള ഫോട്ടോ അപ്‌ലോഡ്',
    'f5-item2': 'AI ടാമ്പർ ഡിറ്റക്ഷൻ',
    'f5-item3': 'കമ്മ്യൂണിറ്റി ഇടപെടൽ',

    'f6-title': 'അടിയന്തര SOS സംവിധാനം',
    'f6-desc': 'അപകടമുണ്ടായാൽ രക്ഷപ്പെടാനുള്ള വഴികൾ കാണിച്ചുകൊണ്ടുള്ള തൽക്ഷണ എമർജൻസി അലേർട്ടുകൾ.',
    'f6-item1': 'വൺ-ടച്ച് എമർജൻസി അലേർട്ട്',
    'f6-item2': 'GPS അടിസ്ഥാനമാക്കിയുള്ള റൂട്ടിംഗ്',
    'f6-item3': 'തത്സമയ സുരക്ഷിത മേഖലകൾ',

    'f7-title': 'പ്രവചന വിശകലനം',
    'f7-desc': 'കാലാവസ്ഥാ വ്യതിയാനങ്ങളും ചരിത്രപരമായ വിവരങ്ങളും വിശകലനം ചെയ്തുകൊണ്ട് മൃഗങ്ങളുടെ ചലനങ്ങൾ പ്രവചിക്കുന്നു.',
    'f7-item1': 'സീസണൽ പാറ്റേൺ വിശകലനം',
    'f7-item2': 'പരിസ്ഥിതി ഏകീകരണം',
    'f7-item3': 'ചലന പ്രവചനം',

    'f8-title': 'ബിഹേവിയറൽ ഇൻ്റലിജൻസ്',
    'f8-desc': 'മെഷീൻ ലേണിംഗ് മോഡലുകൾ മൃഗങ്ങളുടെ സ്വഭാവം വിശകലനം ചെയ്തുകൊണ്ട് കൃത്യത മെച്ചപ്പെടുത്തുന്നു.',
    'f8-item1': 'നിരന്തരമായ പഠനം',
    'f8-item2': 'പാറ്റേൺ അഡാപ്റ്റേഷൻ',
    'f8-item3': 'ഭീഷണി നിരീക്ഷണം',

    'f9-title': 'കൺസർവേഷൻ മാനേജ്‌മെൻ്റ്',
    'f9-desc': 'വന്യജീവി സംരക്ഷണ പ്രവർത്തനങ്ങൾക്ക് സഹായകമാകുന്ന രീതിയിലുള്ള വിവരങ്ങൾ ശേഖരിക്കുന്നു.',
    'f9-item1': 'ജനസംഖ്യാ ട്രാക്കിംഗ്',
    'f9-item2': 'വാസസ്ഥല വിശകലനം',
    'f9-item3': 'സംരക്ഷണ ഉൾക്കാഴ്ചകൾ',

    // About Section
    'about-title': 'പദ്ധതിയെക്കുറിച്ച്',
    'about-desc1': 'വനത്തോടു ചേർന്നുള്ള പ്രദേശങ്ങളിൽ മനുഷ്യ-വന്യജീവി സംഘർഷം ഒരു വലിയ വെല്ലുവിളിയാണ്, ഇത് കൃഷിനാശത്തിനും ജീവഹാനിക്കും കാരണമാകുന്നു.',
    'about-desc2': 'ഞങ്ങളുടെ AI സ്മാർട്ട് ഫെൻസിംഗ് സിസ്റ്റം താഴെ പറയുന്ന ഗുണങ്ങൾ നൽകുന്നു:',
    'about-item1': 'തത്സമയ നിരീക്ഷണം',
    'about-item1-desc': 'വന്യജീവികളുടെ ചലനവും കടന്നുകയറ്റവും കണ്ടെത്തുന്നു',
    'about-item2': 'ബിഹേവിയറൽ ഇൻ്റലിജൻസ്',
    'about-item2-desc': 'വന്യജീവികളെ കൃത്യമായി തിരിച്ചറിയാൻ',
    'about-item3': 'പ്രവചന വിശകലനം',
    'about-item3-desc': 'മൃഗങ്ങളുടെ ചലന പാറ്റേണുകൾ പ്രവചിക്കാൻ',
    'about-item4': 'കമ്മ്യൂണിറ്റി ഇടപെടൽ',
    'about-item4-desc': 'സ്ഥിരീകരിച്ച റിപ്പോർട്ടിംഗ് സംവിധാനത്തിലൂടെ',
    'about-item5': 'അടിയന്തര പ്രതികരണം',
    'about-item5-desc': 'SOS അലേർട്ടുകളും രക്ഷപ്പെടാനുള്ള മാർഗ്ഗനിർദ്ദേശങ്ങളും',
    'about-desc3': 'ആധുനിക സാങ്കേതികവിദ്യയുടെ സഹായത്തോടെ മനുഷ്യനും വന്യജീവികളും തമ്മിലുള്ള സമാധാനപരമായ സഹവർത്തിത്വം ഉറപ്പാക്കുകയാണ് ഞങ്ങളുടെ ലക്ഷ്യം.',

    'cap-title': 'സിസ്റ്റം സവിശേഷതകൾ',
    'cap-species': 'തിരിച്ചറിഞ്ഞ ഇനങ്ങൾ',
    'cap-area': 'നിരീക്ഷണ വിസ്തൃതി',
    'cap-response': 'അലേർട്ട് റെസ്‌പോൺസ് ടൈം',
    'cap-users': 'സജീവ ഉപയോക്താക്കൾ',

    // How it works
    'how-title': 'ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു',
    'how-step1-title': 'കണ്ടെത്തൽ',
    'how-step1-desc': 'തെർമൽ, വിഷ്വൽ, അക്കോസ്റ്റിക് സെൻസറുകൾ ഉപയോഗിച്ച് അതിർത്തിയിലെ ചലനങ്ങൾ കണ്ടെത്തുന്നു.',
    'how-step2-title': 'തിരിച്ചറിയൽ',
    'how-step2-desc': 'സ്വഭാവരീതികളും ശാരീരിക പ്രത്യേകതകളും വിശകലനം ചെയ്ത് വന്യജീവികളെ തിരിച്ചറിയുന്നു.',
    'how-step3-title': 'പ്രതികരണം',
    'how-step3-desc': 'വന്യജീവികളുടെ അപകടസാധ്യത അനുസരിച്ചുള്ള അലേർട്ടുകൾ പുറപ്പെടുവിക്കുന്നു.',
    'how-step4-title': 'പ്രതിരോധം',
    'how-step4-desc': 'ബുദ്ധിപരമായ പ്രതിരോധ മാർഗ്ഗങ്ങളിലൂടെ സംഘർഷങ്ങൾ ഉണ്ടാകാതെ തടയുന്നു.',

    // User Portal
    'portal-desc1': 'വന്യജീവി കാഴ്ചകൾ റിപ്പോർട്ട് ചെയ്യുക, സുരക്ഷാ വിവരങ്ങൾ ആക്‌സസ് ചെയ്യുക, നിങ്ങളുടെ പ്രദേശത്തെ വന്യജീവി പ്രവർത്തനങ്ങളെക്കുറിച്ച് അറിഞ്ഞിരിക്കുക.',
    'alerts-title': 'നിങ്ങളുടെ പ്രദേശത്തെ സജീവ അലേർട്ടുകൾ',
    'animal-count-label': 'മൃഗങ്ങളുടെ എണ്ണം',
    'behavior-label': 'നിരീക്ഷിച്ച സ്വഭാവം',
    'behavior-placeholder': 'മൃഗങ്ങൾ എന്ത് ചെയ്യുകയായിരുന്നു എന്ന് വിവരിക്കുക...',
    'upload-photo-label': 'ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക (സ്ഥിരീകരണത്തിന് ആവശ്യമാണ്)',
    'upload-click': 'ചിത്രം അപ്‌ലോഡ് ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക',
    'upload-format': 'PNG, JPG 10MB വരെ',
    'recent-reports-title': 'സമീപകാല കമ്മ്യൂണിറ്റി റിപ്പോർട്ടുകൾ',

    // Safety Guidelines
    'safety-guidelines-title': 'സുരക്ഷാ മാർഗ്ഗനിർദ്ദേശങ്ങൾ',
    'guideline-dangerous-wildlife-title': 'നിങ്ങൾ അപകടകാരികളായ വന്യജീവികളെ കണ്ടുമുട്ടിയാൽ',
    'guideline-dangerous-wildlife-1': 'ശാന്തത പാലിക്കുക, ഓടരുത്',
    'guideline-dangerous-wildlife-2': 'മൃഗത്തിന് അഭിമുഖമായി സാവധാനം പിന്നോട്ട് മാറുക',
    'guideline-dangerous-wildlife-3': 'കൈകൾ ഉയർത്തി നിങ്ങളെ വലുതായി കാണിക്കുക',
    'guideline-dangerous-wildlife-4': 'വേട്ടമൃഗങ്ങളുമായി നേരിട്ട് കണ്ണിൽ നോക്കരുത്',
    'guideline-dangerous-wildlife-5': 'അടിയന്തര സഹായത്തിനായി SOS ബട്ടൺ ഉടൻ ഉപയോഗിക്കുക',
    'guideline-dangerous-wildlife-6': 'മറ്റുള്ളവരെ അറിയിക്കാൻ ശബ്ദമുണ്ടാക്കുക',

    'guideline-sos-system-title': 'SOS സംവിധാനം ഉപയോഗിക്കുന്നു',
    'guideline-sos-system-1': 'താഴെ വലത് വശത്തുള്ള SOS ബട്ടൺ അമർത്തുക',
    'guideline-sos-system-2': 'നിങ്ങളുടെ ലൊക്കേഷൻ ഓട്ടോമാറ്റിക്കായി പങ്കിടുന്നു',
    'guideline-sos-system-3': 'വന വകുപ്പ് അധികൃതരെ ഉടൻ അറിയിക്കുന്നു',
    'guideline-sos-system-4': 'സ്ക്രീനിലെ രക്ഷപ്പെടൽ മാർഗ്ഗങ്ങൾ പിന്തുടരുക',
    'guideline-sos-system-5': 'അധികൃതർ ബന്ധപ്പെട്ടാൽ ഫോണിൽ തുടരുക',
    'guideline-sos-system-6': 'സൂചിപ്പിച്ചതുപോലെ അടുത്തുള്ള സുരക്ഷിത മേഖലയിലേക്ക് നീങ്ങുക',

    'guideline-agricultural-protection-title': 'കാർഷിക സംരക്ഷണ നുറുങ്ങുകൾ',
    'guideline-agricultural-protection-1': 'കൃഷിയിടത്തിന് ചുറ്റും മതിയായ വേലി സ്ഥാപിക്കുക',
    'guideline-agricultural-protection-2': 'മോഷൻ സെൻസർ ലൈറ്റുകൾ ഉപയോഗിക്കുക',
    'guideline-agricultural-protection-3': 'വിളവെടുപ്പ് കൃത്യസമയത്ത് നടത്തുക',
    'guideline-agricultural-protection-4': 'ഉൽപ്പന്നങ്ങൾ സുരക്ഷിതമായി സൂക്ഷിക്കുക',
    'guideline-agricultural-protection-5': 'വിളനാശം അധികൃതരെ അറിയിക്കുക',
    'guideline-agricultural-protection-6': 'സംഘടിത നിരീക്ഷണത്തിനായി അയൽക്കാരുമായി സഹകരിക്കുക',

    'guideline-community-safety-title': 'കമ്മ്യൂണിറ്റി സുരക്ഷാ നടപടികൾ',
    'guideline-community-safety-1': 'അപകടസാധ്യതയുള്ള സമയങ്ങളിൽ കൂട്ടമായി സഞ്ചരിക്കുക',
    'guideline-community-safety-2': 'പുലർച്ചെയും സന്ധ്യക്കും വനപ്രദേശങ്ങൾ ഒഴിവാക്കുക',
    'guideline-community-safety-3': 'കുട്ടികളെ വന അതിർത്തിയിൽ ശ്രദ്ധിക്കുക',
    'guideline-community-safety-4': 'മൃഗങ്ങളെ സുരക്ഷിതമായ കൂടുകളിൽ സൂക്ഷിക്കുക',
    'guideline-community-safety-5': 'വന്യജീവികളെ കണ്ടാൽ മറ്റുള്ളവരുമായി പങ്കിടുക',
    'guideline-community-safety-6': 'ബോധവൽക്കരണ പരിപാടികളിൽ പങ്കെടുക്കുക',

    // SOS Modal in User Portal
    'sos-activated-title': 'അടിയന്തര SOS സജീവമാക്കി',
    'sos-location-shared': 'നിങ്ങളുടെ ലൊക്കേഷൻ പങ്കിട്ടു',
    'sos-authorities-notified': 'വന വകുപ്പ് അധികൃതരെ അറിയിച്ചു',
    'sos-help-on-way': 'സഹായം വരുന്നു. ശാന്തത പാലിക്കുകയും സുരക്ഷാ മാർഗ്ഗനിർദ്ദേശങ്ങൾ പാലിക്കുകയും ചെയ്യുക.',
    'sos-safe-zone-title': 'അടുത്തുള്ള സുരക്ഷിത മേഖല',
    'sos-direction': 'ദിശ',
    'sos-distance': 'ദൂരം',
    'sos-follow-direction': 'സുരക്ഷിതത്വത്തിലെത്താൻ ഈ ദിശ പിന്തുടരുക',
    'sos-call-emergency': 'എമർജൻസി വിളിക്കുക (100)',
    'sos-close': 'അടയ്ക്കുക',

    // Emergency SOS Page
    'emergency-banner': 'Emergency Response & Wildlife Reporting System',
    'sos-title': 'Emergency SOS',
    'sos-subtitle': 'Immediate help for wildlife encounters',
    'sos-ready': 'Ready for Emergency',
    'sos-ready-desc': 'Press the button below if you encounter dangerous wildlife or need immediate assistance.',
    'activate-sos': 'ACTIVATE EMERGENCY SOS',
    'sos-warning-title': 'When to use SOS:',
    'sos-warning-desc': 'Dangerous wildlife encounter, injury, or immediate threat to life. False alarms may result in penalties.',
    'sos-activated': 'EMERGENCY SOS ACTIVATED',
    'location-shared': 'Your location has been shared',
    'acquiring-gps': 'Acquiring GPS coordinates...',
    'authorities-notified': 'Forest authorities notified',
    'help-coming': 'Help is on the way. Stay calm and follow safety guidelines.',
    'nearest-safe-zone': 'Nearest Safe Zone',
    'direction': 'Direction',
    'distance': 'Distance',
    'follow-direction': 'Follow this direction to reach safety',
    'deactivate-sos': 'Deactivate SOS',

    // Report Form
    'report-title': 'Report Wildlife Sighting',
    'report-subtitle': 'Help us track and protect wildlife',
    'location-label': 'Location',
    'location-placeholder': 'Enter location or use GPS',
    'use-gps': 'Use My Current Location',
    'date-label': 'Date',
    'time-label': 'Time',
    'species-label': 'Species (if known)',
    'select-species': 'Select species...',
    'species-tiger': 'Tiger / കടുവ',
    'species-leopard': 'Leopard / പുലി',
    'species-elephant': 'Elephant / ആന',
    'species-boar': 'Wild Boar / കാട്ടുപന്നി',
    'species-deer': 'Deer / മാൻ',
    'species-bear': 'Bear / കരടി',
    'species-monkey': 'Monkey / കുരങ്ങ്',
    'species-snake': 'Snake / പാമ്പ്',
    'species-other': 'Other',
    'species-unknown': 'Unknown',
    'upload-photo': 'Upload Photo (Required for verification)',
    'drag-drop': 'Drag & drop image here or click to browse',
    'file-types': 'PNG, JPG up to 10MB',
    'notes-label': 'Additional Notes',
    'notes-placeholder': 'Describe what you observed...',
    'contact-label': 'Your Contact Number (Optional)',
    'submit-report': 'Submit Report',

    // Footer
    'emergency-hotline': 'Emergency Hotline:',
    'footer-tagline': 'Protecting lives, preserving wildlife.'
  }
};

// ===================================
// Language Switcher Functions
// ===================================
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('preferredLanguage', lang);

  // Update all elements with data-lang attribute
  document.querySelectorAll('[data-lang]').forEach(element => {
    const key = element.getAttribute('data-lang');
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });

  // Update elements with data-lang-placeholder attribute
  document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
    const key = element.getAttribute('data-lang-placeholder');
    if (translations[lang] && translations[lang][key]) {
      element.placeholder = translations[lang][key];
    }
  });

  // Update active button state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.querySelector(`[data-lang-switch="${lang}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

function initLanguageSwitcher() {
  // Load saved language preference or default to English
  const savedLang = localStorage.getItem('preferredLanguage') || 'en';
  setLanguage(savedLang);

  // Add click listeners to language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const lang = this.getAttribute('data-lang-switch');
      setLanguage(lang);
    });
  });
}

// ===================================
// Real-Time Video Stream Logic
// ===================================
let detectionWs = null;

async function startLiveMonitoring() {
    const streamContainer = document.getElementById('liveStreamContainer');
    const streamImg = document.getElementById('video-stream');
    const btnStart = document.getElementById('btn-start-monitoring');
    const btnStop = document.getElementById('btn-stop-monitoring');
    
    // Clear previous detections history
    const detectionsContainer = document.getElementById('wildlifeDetections');
    if (detectionsContainer) {
        detectionsContainer.innerHTML = '';
    }

    streamContainer.style.display = 'block';
    streamImg.src = ''; 
    streamImg.alt = 'Initializing Camera and Model...';
    
    if (btnStart) btnStart.style.display = 'none';
    if (btnStop) btnStop.style.display = 'inline-block';

    // Sync Toggles
    const smsToggle = document.getElementById('toggleAutoSms');
    const soundToggle = document.getElementById('toggleAutoSound');
    if (smsToggle) smsToggle.checked = autoSmsEnabled;
    if (soundToggle) soundToggle.checked = autoSoundEnabled;

    showNotification('Admin Dashboard Initialized', 'success');

    showNotification('Accessing laptop camera...', 'info');

    try {
        // Start WebSocket with "live" filename
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/stream/live`;
        
        if (detectionWs) detectionWs.close();
        
        detectionWs = new WebSocket(wsUrl);
        detectionWs.binaryType = 'blob'; // Ensure we get Blobs for frames
        
        streamImg.alt = 'Initializing camera hardware...';
        
        detectionWs.onmessage = function(event) {
            if (typeof event.data === "string") {
                try {
                    const parsed = JSON.parse(event.data);
                    if (parsed.action === "alert") {
                        addLiveDetectionToFeed(parsed);
                    } else if (parsed.action === "error") {
                        showNotification(`❌ Camera Error: ${parsed.message}`, 'error');
                        streamImg.alt = `Error: ${parsed.message}`;
                    }
                } catch(e) { console.error("Error parsing WS text", e); }
                return;
            }
            
            // Received frame bytes
            const urlObject = URL.createObjectURL(event.data);
            streamImg.src = urlObject;
            streamImg.onload = () => {
                URL.revokeObjectURL(urlObject);
            };
            
            if (streamImg.alt !== 'Live Stream Active') {
                streamImg.alt = 'Live Stream Active';
                showNotification('✅ Camera connected. Monitoring active.', 'success');
            }
        };
        
        detectionWs.onerror = function(error) {
            console.error('WebSocket Error:', error);
            showNotification('Camera stream error. Make sure the backend is running and camera is available.', 'error');
            streamImg.alt = 'Stream Error';
            stopDetectionStream();
        };
        
        let reconnectAttempts = 0;
        const maxReconnects = 3;

        detectionWs.onclose = function(event) {
            console.log(`WebSocket Closed: Code ${event.code}, Reason: ${event.reason}`);
            
            if (event.code === 1011) {
                showNotification(`⚠️ Monitoring stopped: ${event.reason || 'Server error'}`, 'error');
                streamImg.alt = `Error: ${event.reason}`;
            } else if (event.code === 1006) {
                if (reconnectAttempts < maxReconnects) {
                    reconnectAttempts++;
                    showNotification(`🔄 Connection interrupted. Reconnecting (Attempt ${reconnectAttempts}/${maxReconnects})...`, 'warning');
                    streamImg.alt = 'Reconnecting...';
                    setTimeout(() => startLiveMonitoring(), 3000);
                    return; // Skip the default stop logic
                } else {
                    showNotification('🚨 Connection lost permanently. Please refresh the page or check the backend.', 'error');
                    streamImg.alt = 'Connection Failed';
                }
            } else {
                showNotification('ℹ️ Monitoring session ended.', 'info');
                streamImg.alt = 'Monitoring Ended';
            }
            
            if (btnStart) btnStart.style.display = 'inline-block';
            if (btnStop) btnStop.style.display = 'none';
        };

    } catch (error) {
        console.error("Error starting live monitoring:", error);
        showNotification('Failed to start monitoring. Check server connection.', 'error');
        streamContainer.style.display = 'none';
        if (btnStart) btnStart.style.display = 'inline-block';
        if (btnStop) btnStop.style.display = 'none';
    }
}

function stopDetectionStream() {
    if (detectionWs) {
        detectionWs.close();
        detectionWs = null;
    }
    const streamContainer = document.getElementById('liveStreamContainer');
    if (streamContainer) streamContainer.style.display = 'none';
    
    const streamImg = document.getElementById('video-stream');
    if (streamImg) streamImg.src = '';

    const btnStart = document.getElementById('btn-start-monitoring');
    const btnStop = document.getElementById('btn-stop-monitoring');
    if (btnStart) btnStart.style.display = 'inline-block';
    if (btnStop) btnStop.style.display = 'none';
    
    showNotification('Monitoring stopped.', 'info');
}

function simulateDetection() {
    const mockData = {
        action: "alert",
        species: "Tiger",
        confidence: "98%",
        image: "tiger_preview.jpg", // Using existing preview image
        danger_level: "high"
    };
    
    showNotification('🧪 Simulating AI detection event...', 'info');
    addLiveDetectionToFeed(mockData);
}

function addLiveDetectionToFeed(data) {
    const container = document.getElementById('wildlifeDetections');
    if (!container) return;

    let danger = "medium";
    let icon = "🐾";
    const speciesLower = data.species.toLowerCase();
    
    if (speciesLower === "tiger" || speciesLower === "leopard" || speciesLower === "poacher") {
        danger = "high";
        icon = speciesLower === "poacher" ? "🚨" : "🐅";
    } else if (speciesLower === "elephant") {
        danger = "medium";
        icon = "🐘";
    }

    const timeStr = new Date().toLocaleTimeString();

    const newDetection = document.createElement('div');
    newDetection.className = `detection-item ${danger}-danger`;
    
    newDetection.innerHTML = `
      <div style="display: flex; gap: var(--space-md); align-items: start;">
        <img src="${data.image}" alt="Preview" style="width: 120px; height: 80px; object-fit: cover; border-radius: var(--radius-sm); border: 2px solid ${danger === 'high' ? 'var(--color-danger-high)' : 'var(--color-warning)'};">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-xs);">
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
              <span style="font-size: 1.5rem;">${icon}</span>
              <div>
                <div style="font-weight: 600; color: var(--color-text-light);">${data.species.toUpperCase()}</div>
                <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">📹 LIVE FEED</div>
              </div>
            </div>
            <span class="badge badge-${danger === 'high' ? 'danger' : 'warning'}">${danger.toUpperCase()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: rgba(255, 255, 255, 0.5);">
            <span>🕐 ${timeStr}</span>
            <span>🎯 ${data.confidence} confidence</span>
          </div>
        </div>
      </div>
    `;

    container.insertBefore(newDetection, container.firstChild);
    
    if (container.children.length > 8) {
        container.removeChild(container.lastChild);
    }

    // Popup verification logic
    const now = Date.now();
    const isSameSpecies = lastPopupSpecies === data.species;
    const cooldownPeriod = 30000; // 30 seconds

    if (!isSameSpecies || (now - lastPopupTime) > cooldownPeriod) {
        lastPopupTime = now;
        lastPopupSpecies = data.species;
        currentDetectionData = data;
        showDetectionPopups(data);
    }
}

// ===================================
// Two-Popup Detection Alert System
// ===================================

function showDetectionPopups(data) {
    // Determine species info
    const speciesLower = data.species.toLowerCase();
    let dangerLevel = 'medium';
    let dangerColor = '#ff9900';
    let badgeText = 'MEDIUM RISK';

    if (speciesLower.includes('tiger') || speciesLower.includes('leopard') || speciesLower.includes('poacher')) {
        dangerLevel = 'high';
        dangerColor = '#ff4444';
        badgeText = 'HIGH RISK 🔴';
    } else if (speciesLower.includes('elephant') || speciesLower.includes('bear')) {
        dangerLevel = 'medium';
        dangerColor = '#ff9900';
        badgeText = 'MEDIUM RISK 🟡';
    } else {
        dangerLevel = 'low';
        dangerColor = '#44bb44';
        badgeText = 'LOW RISK 🟢';
    }

    // ---- NEW: Poacher Detection Filter ----
    // As per requirement, don't trigger active alerts (SMS/Sound) for poachers.
    // They will still be visible in the history feed.
    if (speciesLower === 'poacher') {
        console.log('[System] Poacher detected: Logging to history only. No active alerts triggered.');
        return; 
    }

    // ---- Show SMS Popup (Popup 1) ----
    const smsModal = document.getElementById('smsAlertModal');
    if (smsModal) {
        document.getElementById('smsModalImage').src = data.image;
        document.getElementById('smsModalSpecies').textContent = data.species.toUpperCase();
        document.getElementById('smsModalConfidence').textContent = `Confidence: ${data.confidence}`;
        const badge = document.getElementById('smsModalDangerBadge');
        badge.textContent = badgeText;
        badge.style.background = dangerColor;
        smsModal.classList.remove('hidden');

        if (autoSmsEnabled) {
            console.log(`[Auto-SMS] Automatically triggering alert for ${data.species}`);
            showNotification(`📱 Alert Activated`, 'info');
            doSendSms(); // This function calls /api/send_sms
            // In auto-mode, we don't show the modal at all
            smsModal.classList.add('hidden');
        } else {
            // Check existing auto_response_mode from backend settings as fallback
            const mode = currentSystemSettings.auto_response_mode || 'manual';
            if (mode === 'full' || mode === 'sms-only') {
                console.log(`[Auto-SMS] Triggering automated alert for ${data.species} (Mode: ${mode})`);
                showNotification(`📱 Alert Activated`, 'info');
                doSendSms();
                smsModal.classList.add('hidden');
            } else {
                // Show modal for manual confirmation
                smsModal.classList.remove('hidden');
            }
        }
    }

    // ---- Prepare Sound Popup (Popup 2) - shown after SMS popup is dismissed ----
    prepareSoundPopup(data.species);

    // Automated Sound Trigger?
    if (autoSoundEnabled) {
        console.log(`[Auto-Sound] Automatically playing deterrent for ${data.species}`);
        // Delay slightly to allow SMS logic to start
        setTimeout(() => {
            doPlaySound();
            showNotification(`🔊 Alarm Activated`, 'info');
        }, 1000);
        // Sound modal stays hidden in auto mode
    } else {
        // Prepare but don't show yet (it will show after SMS modal dismissal)
    }
}

function prepareSoundPopup(species) {
    const speciesLower = species.toLowerCase();
    let icon = '🐾';
    let soundDesc = 'Loud deterrent sound for 10 seconds';
    
    if (speciesLower.includes('elephant')) {
        icon = '🐘';
        soundDesc = '🐝 Bee/Wasp Swarm Sound — 10 seconds (elephants fear bees)';
    } else if (speciesLower.includes('tiger')) {
        icon = '🐅';
        soundDesc = '🚨 Air Horn / Siren Sound — 10 seconds';
    } else if (speciesLower.includes('leopard')) {
        icon = '🐆';
        soundDesc = '🚨 High-Intensity Siren — 10 seconds';
    } else if (speciesLower.includes('wild boar') || speciesLower.includes('boar')) {
        icon = '🐗';
        soundDesc = '📢 Loud Air Horn — 10 seconds';
    } else if (speciesLower.includes('bear')) {
        icon = '🐻';
        soundDesc = '📢 Air Horn / Siren — 10 seconds';
    } else if (speciesLower.includes('poacher')) {
        icon = '🚨';
        soundDesc = '🚨 Emergency Siren — 10 seconds';
    }

    document.getElementById('soundSpeciesIcon').textContent = icon;
    document.getElementById('soundSpeciesName').textContent = species.toUpperCase();
    document.getElementById('soundDescription').textContent = soundDesc;
    document.getElementById('soundCountdown').textContent = '10s';
    document.getElementById('soundVisualizer').style.opacity = '0';
    document.getElementById('btnPlaySound').style.display = '';
    document.getElementById('btnStopSound').style.display = 'none';
}

function dismissSmsModal() {
    const smsModal = document.getElementById('smsAlertModal');
    if (smsModal) smsModal.classList.add('hidden');
    // Show the sound popup immediately after
    const soundModal = document.getElementById('soundAlertModal');
    if (soundModal) soundModal.classList.remove('hidden');
}

async function handleSmsApproval() {
    const autoCheck = document.getElementById('modalEnableAutoSms');
    if (autoCheck && autoCheck.checked) {
        console.log('[System] Enabling Auto-SMS mode from modal');
        autoSmsEnabled = true;
        localStorage.setItem('autoSms', 'true');
        const toggle = document.getElementById('toggleAutoSms');
        if (toggle) toggle.checked = true;
        showNotification('🤖 Auto-SMS Enabled for future alerts', 'success');
    }
    await doSendSms();
}

async function doSendSms() {
    const btn = document.getElementById('btnSendSms');
    if (btn) {
        btn.textContent = '⏳ Sending...';
        btn.disabled = true;
    }

    if (currentDetectionData) {
        try {
            const response = await fetch('/api/send_sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    species: currentDetectionData.species,
                    confidence: currentDetectionData.confidence
                })
            });
            const result = await response.json();
            if (result.success) {
                showNotification(`✅ ${result.message}`, 'success');
            } else {
                showNotification(`⚠️ SMS issue: ${result.message}`, 'warning');
                console.error('[SMS Error]', result.message);
            }
        } catch (e) {
            console.error('[SMS fetch error]', e);
            showNotification('❌ Could not reach SMS gateway.', 'error');
        }
    }

    btn.textContent = '📱 Allow SMS Alert';
    btn.disabled = false;

    // Close SMS popup, show sound popup
    dismissSmsModal();
}

function dismissSoundModal() {
    doStopSound();
    const soundModal = document.getElementById('soundAlertModal');
    if (soundModal) soundModal.classList.add('hidden');
}

// ===================================
// Web Audio API Sound Engine
// ===================================
let audioCtx = null;
let soundNodes = [];
let soundTimer = null;
let soundCountdownTimer = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function handleSoundApproval() {
    const autoCheck = document.getElementById('modalEnableAutoSound');
    if (autoCheck && autoCheck.checked) {
        console.log('[System] Enabling Auto-Sound mode from modal');
        autoSoundEnabled = true;
        localStorage.setItem('autoSound', 'true');
        const toggle = document.getElementById('toggleAutoSound');
        if (toggle) toggle.checked = true;
        showNotification('🔊 Auto-Sound Enabled for future alerts', 'success');
    }
    doPlaySound();
}

function doPlaySound() {
    if (!currentDetectionData) return;
    const species = currentDetectionData.species.toLowerCase();

    const btnPlay = document.getElementById('btnPlaySound');
    const btnStop = document.getElementById('btnStopSound');
    const visualizer = document.getElementById('soundVisualizer');

    if (btnPlay) btnPlay.style.display = 'none';
    if (btnStop) btnStop.style.display = '';
    if (visualizer) visualizer.style.opacity = '1';

    if (species.includes('elephant')) {
        playBeeSwarmSound(10);
    } else if (species.includes('tiger') || species.includes('leopard')) {
        playAirHornSirenSound(10);
    } else if (species.includes('wild boar') || species.includes('boar') || species.includes('bear')) {
        playAirHornSound(10);
    } else {
        // Default: general alarm
        playAirHornSirenSound(10);
    }

    // 10-second countdown
    let secondsLeft = 10;
    const countdownEl = document.getElementById('soundCountdown');
    if (soundCountdownTimer) clearInterval(soundCountdownTimer);
    soundCountdownTimer = setInterval(() => {
        secondsLeft--;
        if (countdownEl) countdownEl.textContent = `${secondsLeft}s`;
        if (secondsLeft <= 0) {
            clearInterval(soundCountdownTimer);
            // Auto-close after sound ends
            setTimeout(() => {
                document.getElementById('soundVisualizer').style.opacity = '0';
                document.getElementById('btnPlaySound').style.display = '';
                document.getElementById('btnStopSound').style.display = 'none';
                if (countdownEl) countdownEl.textContent = '10s';
            }, 500);
        }
    }, 1000);
}

function doStopSound() {
    // Stop all audio nodes
    soundNodes.forEach(node => {
        try { node.stop(); } catch(e) {}
    });
    soundNodes = [];
    if (soundTimer) { clearTimeout(soundTimer); soundTimer = null; }
    if (soundCountdownTimer) { clearInterval(soundCountdownTimer); soundCountdownTimer = null; }

    // Reset UI
    const visualizer = document.getElementById('soundVisualizer');
    if (visualizer) visualizer.style.opacity = '0';
    const btnPlay = document.getElementById('btnPlaySound');
    if (btnPlay) btnPlay.style.display = '';
    const btnStop = document.getElementById('btnStopSound');
    if (btnStop) btnStop.style.display = 'none';
    const countdown = document.getElementById('soundCountdown');
    if (countdown) countdown.textContent = '10s';
}

// ===================================
// User Portal Functions
// ===================================

/**
 * BEE / WASP SWARM sound for ELEPHANT deterrent.
 * Generates a buzzing sound with amplitude modulation (like a bee colony).
 * Elephants are documented to be deterred by bee sounds.
 */
function playBeeSwarmSound(durationSeconds) {
    const ctx = getAudioContext();
    const endTime = ctx.currentTime + durationSeconds;

    // Create multiple oscillators for the bee swarm effect
    const frequencies = [280, 320, 360, 400, 440, 480, 520];
    frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const lfoOsc = ctx.createOscillator(); // LFO for modulation (buzzing)
        const lfoGain = ctx.createGain();

        // LFO creates the 'buzz' modulation at 180-450Hz
        lfoOsc.type = 'sawtooth';
        lfoOsc.frequency.setValueAtTime(180 + (i * 45), ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.4, ctx.currentTime);
        lfoOsc.connect(lfoGain);
        lfoGain.connect(gainNode.gain);

        // Main carrier oscillator (slightly detuned for richness)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq + (Math.random() * 15), ctx.currentTime);

        // Volume envelope with slight randomization
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(ctx.currentTime);
        lfoOsc.start(ctx.currentTime);
        osc.stop(endTime);
        lfoOsc.stop(endTime);

        soundNodes.push(osc, lfoOsc);
    });

    // Auto-stop after duration
    soundTimer = setTimeout(() => {
        doStopSound();
    }, durationSeconds * 1000);
}

/**
 * AIR HORN / SIREN sound for TIGER, LEOPARD deterrent.
 * A sweeping siren from 800Hz down to 300Hz, repeating, with a loud attack.
 */
function playAirHornSirenSound(durationSeconds) {
    const ctx = getAudioContext();
    const endTime = ctx.currentTime + durationSeconds;

    // Layer multiple oscillators for an aggressive 'predator' siren effect
    for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = i % 2 === 0 ? 'square' : 'sawtooth';

        // Fast frequency modulation for more urgency
        const sweepDuration = 0.6; 
        for (let t = ctx.currentTime; t < endTime; t += sweepDuration) {
            osc.frequency.setValueAtTime(900 + (i * 70), t);
            osc.frequency.exponentialRampToValueAtTime(350 + (i * 40), t + sweepDuration / 2);
            osc.frequency.exponentialRampToValueAtTime(900 + (i * 70), t + sweepDuration);
        }

        // Higher gain for impact
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(endTime);
        soundNodes.push(osc);
    }

    // Extra sharp clipping distortion layer
    const distOsc = ctx.createOscillator();
    const distGain = ctx.createGain();
    distOsc.type = 'square';
    distOsc.frequency.setValueAtTime(120, ctx.currentTime);
    distGain.gain.setValueAtTime(0.15, ctx.currentTime);
    distOsc.connect(distGain);
    distGain.connect(ctx.destination);
    distOsc.start(ctx.currentTime);
    distOsc.stop(endTime);
    soundNodes.push(distOsc);

    soundTimer = setTimeout(() => {
        doStopSound();
    }, durationSeconds * 1000);
}

/**
 * Plain AIR HORN sound for boar / bear.
 */
function playAirHornSound(durationSeconds) {
    const ctx = getAudioContext();
    const endTime = ctx.currentTime + durationSeconds;

    // Air horn: high-impact square waves with sharp attack
    [380, 520, 680, 820].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq + (Math.random() * 10), ctx.currentTime);

        // Punchy pulse: 0.5s on, 0.15s off
        for (let t = ctx.currentTime; t < endTime; t += 0.65) {
            gainNode.gain.setValueAtTime(0.35, t);
            gainNode.gain.exponentialRampToValueAtTime(0.35, t + 0.45);
            gainNode.gain.setValueAtTime(0.0, t + 0.5);
        }

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(endTime);
        soundNodes.push(osc);
    });

    soundTimer = setTimeout(() => {
        doStopSound();
    }, durationSeconds * 1000);
}

// ===================================
// Navigation
// ===================================
document.addEventListener('DOMContentLoaded', function () {
  // Initialize language switcher
  initLanguageSwitcher();

  // Mobile menu toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('active');
    });
  }

  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Initialize page-specific functionality
  const path = window.location.pathname.toLowerCase();
  const page = path.split('/').pop().replace('.html', '') || 'index';

  if (page === 'user-portal' || page === 'index' || page === '') {
    initUserPortal();
  } else if (page === 'admin-portal') {
    initAdminPortal();
  } else if (page === 'login') {
    initLogin();
  } else if (page === 'emergency-sos') {
    initEmergencySOS();
  }

  // Set current date and time for forms
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0].substring(0, 5);

  const dateInput = document.getElementById('sightingDate');
  const timeInput = document.getElementById('sightingTime');

  if (dateInput) dateInput.value = today;
  if (timeInput) timeInput.value = now;
});

// ===================================
// Emergency SOS Page Functions
// ===================================
function initEmergencySOS() {
  // SOS Activation
  const activateSosBtn = document.getElementById('activateSosBtn');
  const deactivateSosBtn = document.getElementById('deactivateSosBtn');
  const sosStatus = document.getElementById('sosStatus');
  const sosActive = document.getElementById('sosActive');

  if (activateSosBtn) {
    activateSosBtn.addEventListener('click', function () {
      activateEmergencySOS();
    });
  }

  if (deactivateSosBtn) {
    deactivateSosBtn.addEventListener('click', function () {
      deactivateEmergencySOS();
    });
  }

  // Get Location Button
  const getLocationBtn = document.getElementById('getLocationBtn');
  if (getLocationBtn) {
    getLocationBtn.addEventListener('click', function () {
      getCurrentLocationForReport();
    });
  }

  // Drag and Drop Image Upload
  const fileUploadZone = document.getElementById('fileUploadZone');
  const imageUpload = document.getElementById('imageUpload');

  if (fileUploadZone && imageUpload) {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      fileUploadZone.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      fileUploadZone.addEventListener(eventName, function () {
        fileUploadZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      fileUploadZone.addEventListener(eventName, function () {
        fileUploadZone.classList.remove('drag-over');
      }, false);
    });

    // Handle dropped files
    fileUploadZone.addEventListener('drop', function (e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        imageUpload.files = files;
        handleImageUploadForReport({ target: imageUpload });
      }
    }, false);

    // Handle file selection via click
    imageUpload.addEventListener('change', handleImageUploadForReport);
  }

  // Wildlife Sighting Form
  const wildlifeSightingForm = document.getElementById('wildlifeSightingForm');
  if (wildlifeSightingForm) {
    wildlifeSightingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitWildlifeSighting();
    });
  }
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function activateEmergencySOS() {
  const sosStatus = document.getElementById('sosStatus');
  const sosActive = document.getElementById('sosActive');
  const sosLocation = document.getElementById('sosLocation');

  sosStatus.classList.add('hidden');
  sosActive.classList.remove('hidden');

  // Get GPS location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        sosLocation.textContent = `Latitude: ${lat}, Longitude: ${lon}`;
      },
      function () {
        sosLocation.textContent = 'Location: Forest Border Area, Sector 7';
      }
    );
  } else {
    sosLocation.textContent = 'Location: Forest Border Area, Sector 7';
  }

  // Simulate random safe zone direction
  const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];
  const randomDistance = Math.floor(Math.random() * 800) + 200;

  document.getElementById('safeZoneDirection').textContent = randomDirection;
  document.getElementById('safeZoneDistance').textContent = `${randomDistance} meters`;
}

// ===================================
// Sighting Form & SOS Functions
// ===================================
function deactivateEmergencySOS() {
  const sosStatus = document.getElementById('sosStatus');
  const sosActive = document.getElementById('sosActive');

  sosActive.classList.add('hidden');
  sosStatus.classList.remove('hidden');
}

function getCurrentLocationForReport() {
  const locationInput = document.getElementById('reportLocation');
  if (!locationInput) return;

  if (navigator.geolocation) {
    locationInput.value = '🛰️ Syncing GPS...';
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        locationInput.value = `Lat: ${lat}, Lon: ${lon}`;
        showNotification('📍 Location synced to form.', 'info');
      },
      function () {
        locationInput.value = 'Forest Border Area, Sector 7';
      }
    );
  } else {
    locationInput.value = 'Forest Border Area, Sector 7';
  }
}

function handleImageUploadForReport(e) {
  const file = e.target.files[0];
  const imagePreview = document.getElementById('imagePreview');
  const verificationStatus = document.getElementById('verificationStatus');

  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview" style="max-width: 100%; border-radius: var(--radius-md);">`;
      imagePreview.classList.remove('hidden');

      // Simulate AI verification
      verificationStatus.innerHTML = '<div class="loading-spinner" style="margin: var(--space-md) auto;"></div>';

      setTimeout(function () {
        verificationStatus.innerHTML = `
          <div class="alert alert-info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div><strong>Ready for Submission</strong><br>Authentication logic will run on the server upon submit.</div>
          </div>
        `;
      }, 500);
    };
    reader.readAsDataURL(file);
  }
}

async function submitWildlifeSighting() {
  const formElement = document.getElementById('wildlifeSightingForm');
  const submitBtn = formElement.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';

  let lat = "";
  let lon = "";
  const locVal = document.getElementById('reportLocation').value;
  if(locVal.includes("Lat: ")) {
      const parts = locVal.split(",");
      lat = parts[0].replace("Lat: ", "").trim();
      lon = parts[1].replace("Lon: ", "").trim();
  }

  const formData = new FormData();
  formData.append('location_text', locVal);
  formData.append('location_lat', lat);
  formData.append('location_lon', lon);
  formData.append('date', document.getElementById('sightingDate').value);
  formData.append('time', document.getElementById('sightingTime').value);
  formData.append('species', document.getElementById('species').value);
  formData.append('notes', document.getElementById('notes').value);
  formData.append('contact', document.getElementById('contact').value);

  const imageUpload = document.getElementById('imageUpload');
  if (imageUpload.files.length > 0) {
      formData.append('file', imageUpload.files[0]);
  } else {
      showNotification('Please upload an image first.', 'warning');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Report';
      return;
  }

  try {
      const response = await fetch('/api/upload_report', {
          method: 'POST',
          body: formData
      });
      const result = await response.json();

      let msg = '✅ Report Submitted Successfully!<br>Your wildlife sighting has been recorded.';
      if(result.is_authentic) {
          msg += '<br><strong><span style="color:var(--color-safe)">Image Verified as Authentic Camera Photo.</span></strong>';
      } else {
          msg += '<br><strong><span style="color:var(--color-danger-high)">Note: Image flagged as potential internet/AI source.</span></strong>';
      }

      showNotification(msg, 'safe');

      document.getElementById('wildlifeSightingForm').reset();
      document.getElementById('imagePreview').classList.add('hidden');
      document.getElementById('verificationStatus').innerHTML = '';
  } catch (error) {
      console.error(error);
      showNotification('Failed to submit report. Please try again.', 'error');
  } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Report';
  }
}

// ===================================
// User Portal Functions
// ===================================
function initUserPortal() {
  // SOS Button
  const sosButton = document.getElementById('sosButton');
  const sosModal = document.getElementById('sosModal');
  const closeSosModal = document.getElementById('closeSosModal');

  if (sosButton && sosModal) {
    sosButton.addEventListener('click', function () {
      activateSOS();
    });
  }

  if (closeSosModal && sosModal) {
    closeSosModal.addEventListener('click', function () {
      sosModal.classList.add('hidden');
    });
  }

  // Get Location Button
  const getLocationBtn = document.getElementById('getLocationBtn');
  if (getLocationBtn) {
    getLocationBtn.addEventListener('click', function () {
      getCurrentLocationForReport();
    });
  }

  // Image Upload
  const imageUpload = document.getElementById('imageUpload');
  if (imageUpload) {
    imageUpload.addEventListener('change', function (e) {
      handleImageUploadForReport(e);
    });
  }

  // Sighting Form
  const sightingForm = document.getElementById('sightingForm');
  if (sightingForm) {
    sightingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitWildlifeSighting();
    });
  }

  // Load active alerts
  loadActiveAlerts();

  // Load recent community reports
  loadRecentReports();
}

function activateSOS() {
  const sosModal = document.getElementById('sosModal');
  const sosLocation = document.getElementById('sosLocation');

  sosModal.classList.remove('hidden');

  // Simulate getting GPS location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        sosLocation.textContent = `Latitude: ${lat}, Longitude: ${lon}`;
      },
      function () {
        sosLocation.textContent = 'Location: Forest Border Area, Sector 7';
      }
    );
  } else {
    sosLocation.textContent = 'Location: Forest Border Area, Sector 7';
  }

  // Simulate random safe zone direction
  const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];
  const randomDistance = Math.floor(Math.random() * 800) + 200;

  document.getElementById('safeZoneDirection').textContent = randomDirection;
  document.getElementById('safeZoneDistance').textContent = `${randomDistance} meters`;
}





function loadActiveAlerts() {
  const alertsContainer = document.getElementById('alertsContainer');
  if (!alertsContainer) return;

  const mockAlerts = [
    {
      type: 'high',
      species: 'Tiger',
      location: 'Sector 3, Near Village Boundary',
      time: '15 minutes ago',
      icon: '🐅'
    },
    {
      type: 'medium',
      species: 'Elephant Herd',
      location: 'Sector 7, Agricultural Area',
      time: '1 hour ago',
      icon: '🐘'
    },
    {
      type: 'low',
      species: 'Wild Boar',
      location: 'Sector 5, Forest Edge',
      time: '2 hours ago',
      icon: '🐗'
    }
  ];

  alertsContainer.innerHTML = mockAlerts.map(alert => `
    <div class="alert alert-danger-${alert.type}">
      <span class="alert-icon">${alert.icon}</span>
      <div style="flex: 1;">
        <strong>${alert.species} Detected</strong><br>
        <span style="font-size: 0.875rem;">📍 ${alert.location}</span><br>
        <span style="font-size: 0.875rem; opacity: 0.8;">🕐 ${alert.time}</span>
      </div>
      <span class="badge badge-${alert.type === 'high' ? 'danger' : alert.type === 'medium' ? 'warning' : 'info'}">
        ${alert.type.toUpperCase()}
      </span>
    </div>
  `).join('');
}

function loadRecentReports() {
  const reportsContainer = document.getElementById('recentReports');
  if (!reportsContainer) return;

  const mockReports = [
    { species: 'Leopard', location: 'Sector 2', time: '3 hours ago', status: 'verified', icon: '🐆' },
    { species: 'Deer', location: 'Sector 6', time: '5 hours ago', status: 'verified', icon: '🦌' },
    { species: 'Wild Boar', location: 'Sector 4', time: '8 hours ago', status: 'verified', icon: '🐗' },
  ];

  reportsContainer.innerHTML = mockReports.map(report => `
    <div class="card">
      <div style="font-size: 3rem; text-align: center; margin-bottom: var(--space-md);">${report.icon}</div>
      <h4 style="text-align: center; margin-bottom: var(--space-sm);">${report.species}</h4>
      <p style="text-align: center; color: var(--color-text-secondary); font-size: 0.875rem;">
        📍 ${report.location}<br>
        🕐 ${report.time}
      </p>
      <div style="text-align: center; margin-top: var(--space-md);">
        <span class="badge badge-success">✓ Verified</span>
      </div>
    </div>
  `).join('');
}

// ===================================
// Admin Portal Functions
// ===================================
function initAdminPortal() {
  // Update last updated time
  updateLastUpdatedTime();
  setInterval(updateLastUpdatedTime, 60000); // Update every minute

  // Load settings into the SMS configuration panel
  loadSystemSettings();

  // Load detection feeds
  loadIntrusionAlerts();
  loadReportValidation();
  loadAnalyticsCharts();
  refreshDevices(); // Load IoT devices on start

  // Also call loadReportHistory on init
  loadReportHistory();

  // Auto-refresh detections every 10 seconds
  detectionInterval = setInterval(function () {
    loadWildlifeDetections();
    loadIntrusionAlerts();
    loadReportValidation();
  }, 10000);
}

let currentSystemSettings = {};

async function loadSystemSettings() {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) return;
    const settings = await response.json();
    currentSystemSettings = settings;

    // Fast2SMS/Recipient
    const keyInput = document.getElementById('setting_fast2sms_api_key');
    const numInput = document.getElementById('setting_alert_to_number');
    if (keyInput && settings.fast2sms_api_key && settings.fast2sms_api_key !== 'YOUR_FAST2SMS_KEY') {
      keyInput.value = settings.fast2sms_api_key;
    }
    if (numInput && settings.alert_to_number) {
      numInput.value = settings.alert_to_number;
    }
    const routeInput = document.getElementById('setting_fast2sms_route');
    if (routeInput && settings.fast2sms_route) {
      routeInput.value = settings.fast2sms_route;
    }

    // Twilio
    const twSid = document.getElementById('setting_twilio_account_sid');
    const twToken = document.getElementById('setting_twilio_auth_token');
    const twFrom = document.getElementById('setting_twilio_from_number');

    if (twSid && settings.twilio_account_sid && settings.twilio_account_sid !== 'YOUR_ACCOUNT_SID') twSid.value = settings.twilio_account_sid;
    if (twToken && settings.twilio_auth_token && settings.twilio_auth_token !== 'YOUR_AUTH_TOKEN') twToken.value = settings.twilio_auth_token;
    if (twFrom && settings.twilio_from_number && settings.twilio_from_number !== '+1XXXXXXXXXX') twFrom.value = settings.twilio_from_number;

    // Alert Config panel
    const smsRec = document.getElementById('smsRecipients');
    const cooldown = document.getElementById('alertCooldown');
    const mode = document.getElementById('autoResponseMode');

    if (smsRec && settings.sms_recipients) smsRec.value = settings.sms_recipients;
    if (cooldown && settings.alert_cooldown) cooldown.value = settings.alert_cooldown;
    if (mode && settings.auto_response_mode) mode.value = settings.auto_response_mode;

  } catch (e) {
    console.warn('[Settings] Could not load settings:', e);
  }
}

async function saveSystemSettings() {
  const btn = document.getElementById('btnSaveSettings');
  const apiKey = document.getElementById('setting_fast2sms_api_key')?.value?.trim();
  const alertNum = document.getElementById('setting_alert_to_number')?.value?.trim();
  const twSid = document.getElementById('setting_twilio_account_sid')?.value?.trim();
  const twToken = document.getElementById('setting_twilio_auth_token')?.value?.trim();
  const twFrom = document.getElementById('setting_twilio_from_number')?.value?.trim();
  const f2sRoute = document.getElementById('setting_fast2sms_route')?.value;

  btn.textContent = '⏳ Saving...';
  btn.disabled = true;

  const payload = {};
  if (apiKey) payload.fast2sms_api_key = apiKey;
  if (alertNum) payload.alert_to_number = alertNum;
  if (twSid) payload.twilio_account_sid = twSid;
  if (twToken) payload.twilio_auth_token = twToken;
  if (twFrom) payload.twilio_from_number = twFrom;
  if (f2sRoute) payload.fast2sms_route = f2sRoute;

  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success) {
      showNotification('✅ SMS & Gateway Settings saved!', 'success');
    } else {
      showNotification(`❌ Failed to save: ${result.message}`, 'error');
    }
  } catch (e) {
    showNotification('❌ Could not reach server to save settings.', 'error');
  } finally {
    btn.textContent = 'Save SMS Settings';
    btn.disabled = false;
  }
}

function updateLastUpdatedTime() {
  const lastUpdated = document.getElementById('lastUpdated');
  if (lastUpdated) {
    const now = new Date();
    lastUpdated.textContent = now.toLocaleTimeString();
  }
}

async function loadWildlifeDetections() {
  const container = document.getElementById('wildlifeDetections');
  if (!container) return;

  try {
      const response = await fetch('/api/detections');
      const detections = await response.json();

      let html = '';
      for (const detection of detections) {
          const danger = detection.danger_level || 'medium';
          const icon = danger === 'high' ? '🐅' : (danger === 'low' ? '🦌' : '🐘');
          
          html += `
            <div class="detection-item ${danger}-danger">
              <div style="display: flex; gap: var(--space-md); align-items: start;">
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-xs);">
                    <div style="display: flex; align-items: center; gap: var(--space-sm);">
                      <span style="font-size: 1.5rem;">${icon}</span>
                      <div>
                        <div style="font-weight: 600; color: var(--color-text-light);">${detection.species}</div>
                        <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">📹 Saved from ${detection.location}</div>
                      </div>
                    </div>
                    <span class="badge badge-${danger === 'high' ? 'danger' : 'warning'}">${danger.toUpperCase()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: rgba(255, 255, 255, 0.5);">
                    <span>🕐 ${new Date(detection.timestamp).toLocaleTimeString()}</span>
                    <span>🎯 ${detection.confidence} confidence</span>
                  </div>
                </div>
              </div>
            </div>
          `;
      }
      // If we don't have detections yet, show a placeholder
      if(html === '') {
          html = '<div style="color:rgba(255,255,255,0.5);">No recent detections. History will populate automatically.</div>';
      }
      
      // We no longer completely overwrite the live-feed if there's no live connection handling its own display.
      // But we will overwrite since we want the latest DB state shown correctly.
      container.innerHTML = html;
  } catch(error) {
      console.error(error);
  }
}

async function loadIntrusionAlerts() {
  const container = document.getElementById('intrusionAlerts');
  if (!container) return;

  const mockIntrusions = [
    {
      type: 'Unauthorized Entry',
      location: 'Sensor 24 - North Boundary',
      time: '5 min ago',
      status: 'Active',
      icon: '🚨'
    },
    {
      type: 'Possible Poaching Activity',
      location: 'Sensor 31 - Protected Zone',
      time: '45 min ago',
      status: 'Investigating',
      icon: '⚠️'
    }
  ];

  container.innerHTML = mockIntrusions.map(intrusion => `
    <div class="detection-item high-danger">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-xs);">
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <span style="font-size: 1.5rem;">${intrusion.icon}</span>
          <div>
            <div style="font-weight: 600; color: var(--color-text-light);">${intrusion.type}</div>
            <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">📍 ${intrusion.location}</div>
          </div>
        </div>
        <span class="badge badge-danger">${intrusion.status}</span>
      </div>
      <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.5);">
        🕐 ${intrusion.time}
      </div>
    </div>
  `).join('');
}

async function loadReportValidation() {
  const container = document.getElementById('reportValidation');
  if (!container) return;

  try {
    const response = await fetch('/api/reports');
    if (!response.ok) throw new Error('Failed to fetch reports');
    const reports = await response.json();

    let html = '';
    for (const report of reports) {
      const locText = report.location_text || 'GPS Coordinates';
      const locCoords = (report.location_lat && report.location_lon) ? `(${report.location_lat}, ${report.location_lon})` : '';
      
      html += `
        <div class="card" style="background: var(--color-surface-dark); border: 1px solid var(--color-border-dark);">
          <div style="text-align: center; margin-bottom: var(--space-md);">
             <img src="${report.image_path ? report.image_path : 'placeholder.jpg'}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
          </div>
          <h4 style="color: var(--color-text-light); text-align: center; margin-bottom: var(--space-sm);">${report.species.toUpperCase()}</h4>
          <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.875rem; text-align: center;">
            👤 Contact: ${report.contact || 'Anonymous'}<br>
            📍 Loc: ${locText}<br>
            <span style="font-size: 0.70rem; opacity: 0.5;">${locCoords}</span><br>
            🕒 Time: ${report.date} ${report.time}
          </p>
          <div style="margin-top: var(--space-md);">
            ${report.is_authentic
              ? '<div class="badge badge-success w-full" style="justify-content: center;">✓ Image Authentic</div>'
              : '<div class="badge badge-danger w-full" style="justify-content: center;">⚠️ AI / Internet Image</div>'
            }
          </div>
          <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-md);">
            <button class="btn btn-${report.is_authentic ? 'primary' : 'outline'} w-full" onclick="validateReport(${report.id}, true)">
              ✓ Approve
            </button>
            <button class="btn btn-outline w-full" style="color: var(--color-danger-high); border-color: var(--color-danger-high);" onclick="validateReport(${report.id}, false)">
              ✗ Reject
            </button>
          </div>
        </div>
      `;
    }
    
    if (html === '') {
      html = '<div style="color:rgba(255,255,255,0.5); width:100%; text-align:center; padding:var(--space-lg);">No reports queued for validation.</div>';
    }
    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading reports:", error);
    container.innerHTML = `<div class="alert alert-danger-high">Failed to load reports: ${error.message}</div>`;
  }
}

async function validateReport(reportId, approved) {
  try {
    const response = await fetch(`/api/reports/${reportId}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: approved })
    });
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Validation failed');
    }

    const data = await response.json();
    if (data.success) {
      const action = approved ? 'approved' : 'rejected';
      showNotification(`✅ Report #${reportId} has been ${action}.`, approved ? 'safe' : 'warning');
      
      // Refresh queues immediately
      loadReportValidation();
      loadReportHistory();
    } else {
      showNotification(`❌ Error: ${data.message || 'Validation failed'}`, 'error');
    }
  } catch (error) {
    console.error("Error validating report:", error);
    showNotification(`❌ Error: ${error.message}`, 'error');
  }
}

async function loadReportHistory() {
  const container = document.getElementById('reportHistory');
  if (!container) return;

  try {
    const response = await fetch('/api/reports/history');
    if (!response.ok) throw new Error('Failed to fetch history');
    const reports = await response.json();

    let html = '';
    for (const report of reports) {
      html += `
        <div class="card" style="background: rgba(45, 80, 22, 0.1); border: 1px solid var(--color-primary-dark);">
          <div style="display: flex; gap: var(--space-md); align-items: center;">
            <img src="${report.image_path ? report.image_path : 'placeholder.jpg'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; color: var(--color-text-light);">${report.species.toUpperCase()}</div>
              <div style="font-size: 0.8125rem; color: rgba(255, 255, 255, 0.5);">📍 ${report.location_text || 'GPS Match'}</div>
              <div style="font-size: 0.8125rem; color: rgba(255, 255, 255, 0.5);">🕐 ${report.date} ${report.time}</div>
            </div>
            <span class="badge badge-success">VERIFIED</span>
          </div>
        </div>
      `;
    }
    
    if (html === '') {
      html = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:var(--space-md);">Verified reports will appear here after approval.</div>';
    }
    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading history:", error);
  }
}

function getCurrentLocation() {
  const locationInput = document.getElementById('location');
  if (!locationInput) return;

  if (navigator.geolocation) {
    locationInput.value = '🛰️ Syncing Precise GPS...';
    showNotification('📡 Requesting high-accuracy GPS data...', 'info');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        const accuracy = position.coords.accuracy.toFixed(0);
        
        locationInput.value = `Lat: ${lat}, Lon: ${lon}`;
        showNotification(`📍 GPS Locked (Precision: ${accuracy}m)`, 'safe');
      },
      function (error) {
        console.warn("GPS Warning:", error.message);
        locationInput.value = 'Forest Border Area, Sector 7';
        showNotification('🛰️ GPS timeout. Switched to default area.', 'warning');
      },
      options
    );
  } else {
    locationInput.value = 'Forest Border Area, Sector 7';
    showNotification('❌ GPS restricted by your browser.', 'error');
  }
}

function loadAnalyticsCharts() {
  // Species Chart
  const speciesChart = document.getElementById('speciesChart');
  if (speciesChart) {
    const speciesData = [
      { name: 'Tiger', count: 45, icon: '🐅' },
      { name: 'Elephant', count: 78, icon: '🐘' },
      { name: 'Leopard', count: 32, icon: '🐆' },
      { name: 'Wild Boar', count: 156, icon: '🐗' },
      { name: 'Deer', count: 203, icon: '🦌' },
      { name: 'Bear', count: 28, icon: '🐻' }
    ];

    const maxCount = Math.max(...speciesData.map(d => d.count));

    speciesChart.innerHTML = speciesData.map(species => `
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-xs);">
        <div style="font-size: 1.5rem;">${species.icon}</div>
        <div style="width: 100%; background: #0f1f0f; border-radius: 4px; height: ${(species.count / maxCount) * 250}px; background: linear-gradient(to top, var(--color-secondary), var(--color-secondary-light));"></div>
        <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); text-align: center;">${species.name}</div>
        <div style="font-weight: 600; color: var(--color-secondary-light);">${species.count}</div>
      </div>
    `).join('');
  }

  // Time Distribution Chart
  const timeChart = document.getElementById('timeChart');
  if (timeChart) {
    const timeData = [
      { hour: '00-04', count: 45 },
      { hour: '04-08', count: 78 },
      { hour: '08-12', count: 32 },
      { hour: '12-16', count: 28 },
      { hour: '16-20', count: 95 },
      { hour: '20-24', count: 112 }
    ];

    const maxCount = Math.max(...timeData.map(d => d.count));

    timeChart.innerHTML = timeData.map(time => `
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-xs);">
        <div style="width: 100%; background: #0f1f0f; border-radius: 4px; height: ${(time.count / maxCount) * 250}px; background: linear-gradient(to top, var(--color-accent), var(--color-accent-light));"></div>
        <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6);">${time.hour}</div>
        <div style="font-weight: 600; color: var(--color-accent-light); font-size: 0.875rem;">${time.count}</div>
      </div>
    `).join('');
  }
}

// ===================================
// Login Functions
// ===================================
function initLogin() {
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const officerId = document.getElementById('officerId').value;
      const password = document.getElementById('password').value;

      // Simple demo authentication
      if (officerId === 'officer123' && password === 'demo123') {
        showNotification('✅ Login Successful!<br>Welcome to the Admin Dashboard.', 'safe');
        setTimeout(() => {
          window.location.href = 'admin-portal.html';
        }, 1500);
      } else {
        showNotification('❌ Login Failed<br>Invalid credentials. Please use the demo credentials provided.', 'error');
      }
    });
  }
}

// ===================================
// IoT Device Management Functions
// ===================================
function refreshDevices() {
  const container = document.getElementById('iotDeviceList');
  if (!container) return;

  const mockDevices = [
    { id: 'CAM-001', type: 'Visual Camera', location: 'Sector 3 - North', status: 'online', battery: 87 },
    { id: 'CAM-002', type: 'Visual Camera', location: 'Sector 7 - East', status: 'online', battery: 92 },
    { id: 'THERM-001', type: 'Thermal Sensor', location: 'Sector 2 - West', status: 'online', battery: 78 },
    { id: 'THERM-002', type: 'Thermal Sensor', location: 'Sector 5 - South', status: 'online', battery: 65 },
    { id: 'AUDIO-001', type: 'Acoustic Monitor', location: 'Sector 4 - Center', status: 'online', battery: 94 },
    { id: 'MOTION-001', type: 'Motion Detector', location: 'Sector 1 - Border', status: 'offline', battery: 12 }
  ];

  container.innerHTML = mockDevices.map(device => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm); background: #0f1f0f; border-radius: var(--radius-sm); border-left: 3px solid ${device.status === 'online' ? 'var(--color-safe)' : 'var(--color-danger-high)'};">
      <div style="flex: 1;">
        <div style="font-weight: 600; color: var(--color-text-light); font-size: 0.875rem;">${device.id}</div>
        <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6);">${device.type} - ${device.location}</div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-${device.status === 'online' ? 'success' : 'danger'}" style="font-size: 0.75rem;">${device.status.toUpperCase()}</span>
        <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); margin-top: 4px;">🔋 ${device.battery}%</div>
      </div>
    </div>
  `).join('');

  showNotification('✅ Device status refreshed', 'safe');
}

async function saveAlertConfig() {
  const smsRecipients = document.getElementById('smsRecipients').value;
  const alertCooldown = document.getElementById('alertCooldown').value;
  const autoResponseMode = document.getElementById('autoResponseMode').value;

  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sms_recipients: smsRecipients,
        alert_cooldown: alertCooldown,
        auto_response_mode: autoResponseMode
      })
    });
    const result = await response.json();
    if (result.success) {
      // Immediately update local settings so automation works without refresh
      currentSystemSettings.sms_recipients = smsRecipients;
      currentSystemSettings.alert_cooldown = alertCooldown;
      currentSystemSettings.auto_response_mode = autoResponseMode;

      showNotification(`✅ Alert Configuration Secured!<br>
        <small>Broadcasting to ${smsRecipients.split('\n').filter(n=>n.trim()).length} villagers | Mode: ${autoResponseMode}</small>`, 'safe');
    }
  } catch (e) {
    showNotification('❌ Failed to save alert config.', 'error');
  }
}

function exportDetectionData() {
  // Simulate CSV export
  const csvData = `Timestamp,Species,Location,Confidence,Danger Level
2026-01-25 10:30:15,Tiger,Camera 12 - Sector 3,97%,High
2026-01-25 10:22:08,Elephant Herd,Camera 18 - Sector 7,99%,Medium
2026-01-25 10:15:42,Wild Boar,Camera 5 - Sector 5,94%,Medium
2026-01-25 10:08:33,Deer,Camera 9 - Sector 2,96%,Low`;

  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wildlife_detections_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showNotification('📥 Detection data exported successfully!', 'safe');
}

function viewDetectionArchive() {
  showNotification('📸 Opening detection archive...<br><small>This would open a gallery of saved detection images</small>', 'info');
  // In a real implementation, this would open a modal or new page with detection images
}

async function testAlertSystem() {
  const alertNum = document.getElementById('setting_alert_to_number')?.value?.trim()
                || '+919495848807';

  showNotification(`📱 Sending test SMS to ${alertNum}...`, 'info');

  try {
    const response = await fetch('/api/send_sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        species: 'TEST ALERT',
        confidence: '100%'
      })
    });
    const result = await response.json();
    if (result.success) {
      showNotification(`✅ Test SMS sent successfully to ${alertNum}!`, 'success');
    } else {
      showNotification(`⚠️ SMS test failed: ${result.message}`, 'warning');
    }
  } catch (e) {
    showNotification('❌ Could not reach SMS gateway. Is the server running?', 'error');
  }
}

// Duplicate initAdminPortal removed

