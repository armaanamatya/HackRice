/**
 * @typedef {Object} UniversityMapping
 * @property {string} domain - The email domain (e.g., "rice.edu").
 * @property {string} name - The name of the university (e.g., "Rice University").
 */

/**
 * A mapping of email domains to university names.
 * @type {Array<UniversityMapping>}
 */
const universityDomainMap = [
  { domain: "rice.edu", name: "Rice University" },
  { domain: "harvard.edu", name: "Harvard University" },
  { domain: "stanford.edu", name: "Stanford University" },
  { domain: "mit.edu", name: "Massachusetts Institute of Technology" },
  { domain: "berkeley.edu", name: "University of California, Berkeley" },
  { domain: "utexas.edu", name: "University of Texas at Austin" },
  { domain: "uh.edu", name: "University of Houston" },
  { domain: "cougarnet.uh.edu", name: "University of Houston" },
  { domain: "ucla.edu", name: "University of California, Los Angeles" },
  { domain: "umich.edu", name: "University of Michigan" },
  { domain: "upenn.edu", name: "University of Pennsylvania" },
  { domain: "columbia.edu", name: "Columbia University" },
  { domain: "cornell.edu", name: "Cornell University" },
  { domain: "duke.edu", name: "Duke University" },
  { domain: "uchicago.edu", name: "University of Chicago" },
  { domain: "nyu.edu", name: "New York University" },
  { domain: "usc.edu", name: "University of Southern California" },
  { domain: "gatech.edu", name: "Georgia Institute of Technology" },
  { domain: "cmu.edu", name: "Carnegie Mellon University" },
  { domain: "wustl.edu", name: "Washington University in St. Louis" },
  { domain: "northwestern.edu", name: "Northwestern University" },
  { domain: "nd.edu", name: "University of Notre Dame" },
  { domain: "vanderbilt.edu", name: "Vanderbilt University" },
  { domain: "emory.edu", name: "Emory University" },
  { domain: "georgetown.edu", name: "Georgetown University" },
  { domain: "virginia.edu", name: "University of Virginia" },
  { domain: "unc.edu", name: "University of North Carolina at Chapel Hill" },
  { domain: "ufl.edu", name: "University of Florida" },
  { domain: "wisc.edu", name: "University of Wisconsin-Madison" },
  { domain: "uw.edu", name: "University of Washington" },
  { domain: "psu.edu", name: "Pennsylvania State University" },
  { domain: "osu.edu", name: "Ohio State University" },
  { domain: "purdue.edu", name: "Purdue University" },
  { domain: "illinois.edu", name: "University of Illinois Urbana-Champaign" },
  { domain: "tamu.edu", name: "Texas A&M University" },
  { domain: "utdallas.edu", name: "University of Texas at Dallas" },
  { domain: "sjsu.edu", name: "San Jose State University" },
  { domain: "csus.edu", name: "California State University, Sacramento" },
  { domain: "fullerton.edu", name: "California State University, Fullerton" },
  { domain: "calpoly.edu", name: "California Polytechnic State University, San Luis Obispo" },
  { domain: "sdsu.edu", name: "San Diego State University" },
  { domain: "sfsu.edu", name: "San Francisco State University" },
  { domain: "cpp.edu", name: "California State Polytechnic University, Pomona" },
  { domain: "csulb.edu", name: "California State University, Long Beach" },
  { domain: "csun.edu", name: "California State University, Northridge" },
  { domain: "ucdavis.edu", name: "University of California, Davis" },
  { domain: "ucsb.edu", name: "University of California, Santa Barbara" },
  { domain: "ucsc.edu", name: "University of California, Santa Cruz" },
  { domain: "uci.edu", name: "University of California, Irvine" },
  { domain: "ucsd.edu", name: "University of California, San Diego" },
  { domain: "ucr.edu", name: "University of California, Riverside" },
  { domain: "ucmerced.edu", name: "University of California, Merced" },
  { domain: "ucsf.edu", name: "University of California, San Francisco" }
];

/**
 * Detects the university name from an email address based on a predefined mapping.
 * @param {string} email - The user's email address.
 * @returns {string | null} The name of the university if a match is found, otherwise null.
 */
export const detectUniversityFromEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const parts = email.toLowerCase().split('@');
  if (parts.length < 2) {
    return null; // Not a valid email format
  }

  const domain = parts[1];

  // Check for direct domain matches
  for (const uni of universityDomainMap) {
    if (uni.domain === domain) {
      return uni.name;
    }
  }

  // Handle subdomains by checking if the domain *ends* with a known university domain
  // e.g., "cs.stanford.edu" should match "stanford.edu"
  for (const uni of universityDomainMap) {
    if (domain.endsWith(`.${uni.domain}`)) {
      return uni.name;
    }
  }

  return null;
};
