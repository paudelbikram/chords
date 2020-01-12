// Represents a chord
export class Chord {

  // Build a chord from a series of 'raw' data
  constructor(raw) {
    // {raw, key, names, modifiers, octaves}
    this.raw = filterOvertones(raw);
    this.raw.sort((a, b) => a-b);
    const { key, names, modifiers, octaves } = processRaw(this.raw);
    this.key = key;
    this.names = names;
    this.modifiers = modifiers;
    this.octaves = octaves;
  }

  get length() {
    return this.raw.length;
  }

  // Return human readable name of chord
  // as html
  get name() {
    const letters = "CDEFGAB";
    const mods = [String.fromCharCode(9837), "", String.fromCharCode(9839)];
    const note = idx => `${letters[this.names[idx]]}${mods[1+this.modifiers[idx]]}<sub>${this.octaves[idx]}</sub>`;
    if (this.key)
      return `${note(0)} ${this.key}`;
    const names = [];
    for (let i = 0; i < this.names.length; i ++)
      names.push(note(i));
    return names.join(", ");
  }

  // Render an SVG of the chord
  svg() {
    const names = this.names,
          modifiers = this.modifiers,
          octaves = this.octaves;

    const fragments = [];

    // Render svg for each note head
    let minY = Infinity,
        maxY = -Infinity;
    let flipCount = 1;
    function needsFlip(i) {
      // out of bounds works because undefined -> NaN !== 1
      return (octaves[i]*7+names[i]-octaves[i-1]*7-names[i-1] === 1) ||
        (-octaves[i]*7-names[i]+octaves[i+1]*7+names[i+1] === 1);
    }
    let modCount = 0;
    for (let i = names.length-1; i >= 0; i --) {
      // Render note belly
      const y = -(15*names[i] + 7*15*(octaves[i]-4) - 5*15);
      const flip = needsFlip(i);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      fragments.push(`<use y="${y}" x="${flip ? (flipCount % 2)*38 : 0}" fill="#000000" fill-rule="evenodd" xlink:href="#note"></use>`);
      if (flip) {
        flipCount ++;
      } else {
        flipCount = 1;
      }

      // Render modifiers
      const modOff = modCount * -22;
      if (modifiers[i] === +1)
        fragments.push(`<use y="${y}" x="${modOff}" fill="#000000" fill-rule="evenodd" xlink:href="#sharp"></use>`);
      if (modifiers[i] === -1)
        fragments.push(`<use y="${y}" x="${modOff}" fill="#000000" fill-rule="evenodd" xlink:href="#flat"></use>`);
      if (modifiers[i] !== 0 && modCount < 2) {
        modCount ++;
      } else {
        modCount = 0;
      }
    }

    // Render staff
    let staffLen = 100;
    if (maxY-minY > 20)
      staffLen = maxY-minY + 80;
    let staffBot = 193;
    let staffTop = 193;
    if (193 + maxY < staffLen) {
      // Staff goes down
      staffBot += minY + staffLen;
      staffTop += minY;
    } else {
      // Staff goes up
      staffBot += maxY;
      staffTop += maxY - staffLen;
    }
    fragments.push(`<path d="M169,${staffBot} L169,${staffTop}" id="staff" stroke="#000000" stroke-width="2"></path>`);

    // Extra lines for low/ high notes
    if (maxY > 60) {
      const n = Math.ceil((maxY - 60) / 30);
      for (let i = 0; i < n; i ++) {
        const y = 270 + i * 30;
        fragments.push(`<path d="M120,${y} L180,${y}" id="line-lower-${i}" stroke="#000000" stroke-width="2" stroke-linecap="square"></path>`);
      }
    }

    if (minY < -90) {
      const n = Math.floor((-60 - minY) / 30);
      for (let i = 0; i < n; i ++) {
        const y = 90 - i * 30;
        fragments.push(`<path d="M120,${y} L180,${y}" id="line-lower-${i}" stroke="#000000" stroke-width="2" stroke-linecap="square"></path>`);
      }
    }

    // Return notes SVG embedded in decoration
    // TODO: automatically adjust size of render box
    return `<?xml version="1.0" encoding="UTF-8"?>
      <svg width="230px" height="360px" viewBox="0 0 200 360" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <!-- Generator: chords -->
      <defs>
        <path id="note" d="M153.939693,209.121732 C164.766782,206.33534 171.780011,197.754008 169.604178,189.954791 C167.428346,182.155574 156.887396,178.091876 146.060307,180.878268 C135.233218,183.66466 128.219989,192.245992 130.395822,200.045209 C132.571654,207.844426 143.112604,211.908124 153.939693,209.121732 Z"></path>
        <path id="flat" d="M112.4986,196.73535 C109.25184,200.501149 106.518756,202.656532 102.917376,205.190918 L102.917376,192.713611 C103.736107,190.794787 104.943476,189.241454 106.544665,188.048801 C108.140672,186.860958 109.757406,186.264632 111.394868,186.264632 C119.042524,187.294497 116.364248,193.327346 112.4986,196.73535 Z M102.917376,186.562795 C102.917376,186.562795 102.917376,166.867315 102.917376,151.592738 C102.917376,149.410449 100,149.528546 100,151.592738 L100,207.460805 C100,209.153602 100.497457,210 101.49237,210 C102.067554,210 102.782198,209.552755 103.850108,208.961238 C111.114572,204.809125 115.781265,201.447865 120.441481,195.517209 C121.882188,193.683747 122.900943,189.525767 120.815299,186.621947 C119.514657,184.811039 117.036136,182.908951 113.859564,182.346673 C109.747519,181.618818 106.20142,183.518887 102.917376,186.562795 Z" fill="#000000" fill-rule="nonzero"></path>
        <path id="sharp" d="M115.163856,165.147671 C114.787851,165.336296 114.538012,165.585581 114.350424,165.962 C114.22426,166.213777 114.22426,167.091258 114.22426,172.612905 L114.22426,178.824239 L111.030296,180.266764 L107.833013,181.647799 L107.77159,175.62509 C107.77159,170.228916 107.645425,169.60072 107.583173,169.350604 C106.954009,168.221346 105.261573,168.284499 104.762724,169.475247 C104.636559,169.727024 104.636559,170.604504 104.636559,176.377929 L104.636559,183.028834 L102.629542,183.843162 C101.377853,184.345055 100.564422,184.784626 100.502169,184.909268 C100,185.411161 100,185.474313 100,188.547988 C100,190.995129 100,191.308396 100.188417,191.623325 C100.376835,192.18837 101.067421,192.626279 101.689945,192.501637 C101.943105,192.501637 102.630372,192.18837 103.259536,191.999745 L104.575967,191.4347 C104.637389,191.4347 104.637389,194.195108 104.637389,197.709186 L104.637389,204.044331 L102.630372,204.85866 C101.378683,205.423704 100.565252,205.800123 100.502999,205.987918 C100.00083,206.429151 100.00083,206.552962 100.00083,209.565147 C100.00083,212.074609 100.00083,212.388707 100.189247,212.700313 C100.377665,213.265357 101.068251,213.641776 101.690775,213.580286 C101.943935,213.580286 102.631202,213.265357 103.260366,213.015242 L104.576797,212.450198 C104.638219,212.450198 104.638219,215.024473 104.638219,218.098149 C104.638219,222.989938 104.638219,223.80759 104.764384,224.057705 C105.264063,225.314098 107.082664,225.314098 107.584833,224.057705 C107.77325,223.80759 107.77325,222.928447 107.77325,217.4068 L107.77325,211.00601 L110.970534,209.629961 L114.22592,208.312078 L114.22592,214.394615 C114.22592,219.792451 114.290662,220.418986 114.352085,220.607611 C115.042671,221.79919 116.608942,221.736869 117.172533,220.542797 C117.360951,220.296005 117.360951,219.919586 117.360951,213.580286 L117.360951,206.929381 L119.367968,206.115053 C120.619657,205.550008 121.436408,205.173589 121.497831,204.985795 C122,204.547885 122,204.42075 122,201.409396 C122,198.899934 122,198.587498 121.811583,198.27423 C121.558423,197.709186 120.932579,197.332767 120.306735,197.394257 C120.053575,197.394257 119.366308,197.709186 118.675722,197.959301 L117.420713,198.524346 C117.359291,198.524346 117.359291,195.700786 117.359291,192.18837 L117.359291,185.913884 L119.366308,185.097893 C120.617997,184.532849 121.434748,184.15643 121.496171,183.968636 C121.99834,183.466743 121.99834,183.403591 121.99834,180.393068 C121.99834,177.883606 121.99834,177.569508 121.809923,177.25624 C121.556763,176.691196 120.930919,176.314777 120.305075,176.377929 C120.051915,176.377929 119.364648,176.691196 118.674061,176.942973 L117.419053,177.508018 C117.357631,177.508018 117.357631,174.933742 117.357631,171.923218 C117.357631,166.590196 117.357631,166.213777 117.169213,165.90051 C116.856291,165.147671 115.915865,164.771252 115.163856,165.147671 L115.163856,165.147671 Z M114.22343,193.568574 L114.22343,199.906212 L111.091719,201.222433 C109.399283,201.975271 107.960008,202.603468 107.894435,202.603468 C107.77159,202.66662 107.77159,202.540316 107.77159,196.392134 L107.77159,189.993006 L110.968874,188.611971 L114.22426,187.232598 L114.22426,193.568574 L114.22343,193.568574 Z" fill="#000000" fill-rule="nonzero"></path>
      </defs>
      <!-- Key and lines-->
      <path d="M37.3339691,96.6051722 C30.5872458,103.351895 26.4347363,111.804201 25.3978363,121.293407 C25.1749421,122.925347 25.1749421,126.780336 25.2505494,129.301889 C25.6207305,138.863756 27.1780443,146.056268 31.0330342,158.288938 L31.4778408,159.920877 L28.7333943,163.478348 C19.9118891,174.674118 16.5017058,179.716241 13.5343651,185.796245 C10.6445955,191.802606 9.23456864,197.287572 9.01265634,203.367576 C8.71710057,214.414096 13.6099724,224.792915 22.4334414,231.317726 C29.6230074,236.730029 38.2972256,238.8814 47.6391446,237.546981 C48.4560961,237.470392 49.1237968,237.39773 49.1237968,237.470392 L49.1237968,242.065744 C49.1237968,252.671385 48.4560961,257.116504 46.1574381,261.788446 C44.749375,264.680179 43.0447743,266.828604 40.9680286,268.385918 C38.5957271,270.166126 36.2234256,270.909434 33.3316922,270.909434 C29.9971162,270.909434 27.1044009,270.019821 24.4345798,268.017701 C23.5449667,267.426589 22.1369037,266.015581 21.6174718,265.202557 L21.1000037,264.608499 L21.4701848,264.75775 C24.7320994,265.942919 28.8846089,264.534856 31.0340161,261.566533 C32.8142242,259.196196 33.3316922,256.304462 32.3684357,253.189835 C31.2559284,249.185594 28.1413008,246.515773 24.2116856,246.37045 C20.5795899,246.293861 16.7972615,248.073087 14.797105,251.187714 C13.2397912,253.56198 12.8696101,256.377124 13.7572593,260.086791 C14.797105,264.980644 17.9843942,269.354084 22.5061029,271.946334 C25.4714798,273.803131 28.9553066,274.838068 32.4401154,274.9883 C38.6693706,275.211195 44.1543358,272.245818 48.1585765,266.388707 C50.8283976,262.457128 52.311086,257.861776 52.6802852,252.300222 C53.0504664,248.595464 53.0504664,247.038151 53.1250918,241.698508 L53.1250918,236.358866 L54.0893302,235.990649 C57.9443201,234.433335 61.28086,231.986408 64.097968,228.503563 C68.9152325,222.497202 70.5471717,214.710633 68.5450514,207.001635 C66.7648433,199.959356 62.0202404,193.876406 55.7183236,190.765706 C52.6783214,189.281054 49.786588,188.540692 46.2291177,188.318779 L44.6718039,188.246118 L44.3016228,186.614179 C43.1144901,182.535313 40.9650828,175.565695 38.8146937,168.820936 L38.2952618,167.486516 L39.9272009,165.337109 C46.5992989,156.735552 50.3060199,150.433635 52.6783214,144.059057 C54.8277287,138.127321 55.6446802,131.90003 54.8277287,126.191189 C53.5679345,115.885031 47.7854496,103.133911 41.3342821,96.2389187 C40.2266844,95.0478584 39.6316452,94.7523026 38.8912829,95.1951453 C38.6683887,95.2697707 38.0016698,95.9374714 37.3339691,96.6051722 Z M44.7483931,108.911486 C44.89568,109.209006 46.4529938,112.248026 46.8978004,113.285908 C47.4152684,114.545702 47.860075,116.475161 48.1575946,117.957849 C48.3048815,119.587825 48.3048815,124.85186 48.1575946,126.482817 C47.1197127,135.381893 43.7831728,143.165516 36.5916429,153.175136 C35.9239422,154.064749 35.2572234,155.028006 35.0343291,155.398187 L34.5168611,155.992244 L34.2193415,154.954362 C32.5147407,149.61472 30.8847654,142.943604 30.2897262,139.08665 C29.9941704,137.159155 29.9941704,133.601685 30.2170646,131.67419 C31.0320523,125.444935 33.1824415,120.255525 37.1110749,115.436297 C38.0006879,114.176503 40.298364,111.951488 41.5581582,110.989214 C42.4477713,110.246888 44.4498916,108.839806 44.524517,108.839806 C44.5254989,108.837843 44.6737677,108.911486 44.7483931,108.911486 L44.7483931,108.911486 Z M36.2970691,174.452206 C38.5201198,181.124304 40.5968655,188.388495 40.5222401,188.538728 C40.5222401,188.538728 40.0047721,188.687979 39.6326271,188.687979 C38.4474583,188.983534 36.298051,189.650253 35.1855437,190.168703 C33.108798,191.208549 31.4788227,192.317129 29.9215089,193.873461 C24.9540117,198.917547 23.1747856,206.331971 25.3998001,213.078694 C26.2147878,215.897766 27.846727,218.490998 29.9971162,220.638441 C31.7017169,222.345006 33.4072995,223.606764 35.779601,224.719271 C36.8921083,225.236739 37.1140206,225.236739 37.6324706,225.236739 C38.2265279,225.236739 38.3001713,225.236739 38.6723163,225.013845 C39.2653917,224.6417 39.6345909,223.828676 39.6345909,223.160975 C39.5619294,222.344024 39.2644098,222.048468 38.0046156,221.304178 C32.1475053,217.967638 29.3303973,212.482673 30.9603727,206.997708 C32.0728799,202.993467 35.5576887,199.955429 40.376917,198.916565 C41.3391916,198.621009 43.1193997,198.399097 43.2686504,198.54442 C43.2686504,198.54442 43.6388316,199.87884 44.1562997,202.475999 C46.0111331,209.890423 47.1963019,216.786397 47.938628,223.38387 C48.5317034,227.534415 48.9765099,233.09597 48.8282411,233.317882 C48.6809541,233.390544 46.8261207,233.686099 45.0459127,233.762689 C39.1888025,234.130906 34.1486437,233.241293 29.1801647,230.648061 C26.2903951,229.239998 24.0653805,227.533433 21.840366,225.458652 C18.3555572,221.899217 16.3554007,217.898904 15.9105942,213.449857 C15.7613435,212.260761 15.8359688,209.369027 15.9832558,207.588819 C17.0211377,199.212121 20.4323029,191.356818 27.5492074,181.493503 C29.5513277,178.676395 35.1109183,171.411222 35.2591872,171.411222 L36.2970691,174.452206 L36.2970691,174.452206 Z M49.1228149,198.990208 C56.3870063,200.624111 61.7246846,206.477294 63.0591042,214.040969 C63.208355,214.70867 63.208355,215.45296 63.208355,216.860041 C63.208355,218.566605 63.208355,218.934823 62.9854607,219.970741 C62.7625665,220.715031 62.6133158,221.677305 62.3914035,222.04945 C61.28086,225.38599 58.8339331,228.646923 56.0168251,230.572454 C54.9789432,231.316744 52.9768229,232.279018 52.9021975,232.206357 C52.9021975,232.057106 52.7549106,231.538656 52.7549106,230.948526 C52.457391,227.239842 51.6424033,220.193635 50.8274157,215.153476 C50.0104641,210.408873 48.4551142,202.404319 47.5655011,199.066798 L47.4162504,198.621991 L47.6391446,198.694653 C47.8610569,198.694653 48.4551142,198.767314 49.1228149,198.990208 L49.1228149,198.990208 Z" id="key" fill="#000000" fill-rule="nonzero"></path>
      <path d="M0,240 L230,240" id="line-5" stroke="#000000" stroke-width="2" stroke-linecap="square"></path>
      <path d="M0,210 L230,210" id="line-4" stroke="#000000" stroke-width="2" stroke-linecap="square"></path>
      <path d="M0,180 L230,180" id="line-3" stroke="#000000" stroke-width="2" stroke-linecap="square"></path>
      <path d="M0,150 L230,150" id="line-2" stroke="#000000" stroke-width="2" stroke-linecap="square"></path>
      <path d="M0,120 L230,120" id="line-1" stroke="#000000" stroke-width="2" stroke-linecap="square"></path>
      ${fragments.join("")}
      </svg>`;
  }

}

// Filter overtones
// Remove overtones using simple
// heuristic: more than 3 notes
// means we cut repeated notes
function filterOvertones(raw) {
  if (raw.length <= 3)
    return raw;
  const seen = new Array(12);
  const res = [];
  for (let i = 0; i < raw.length; i ++) {
    const n = (120 + raw[i]) % 12;
    if (seen[n])
      continue;
    res.push(raw[i]);
    seen[n] = true;
  }
  return res;
}

// Mapping from note half-tone
// relative to start (C) of octave
// to possible notes
const nameMap = [
  [0], // C
  [0, 1], // #C or bD
  [1], // D
  [1, 2], // #D or bE
  [2], // E
  [3], // F
  [3, 4], // #F or bG
  [4], // G
  [4, 5], // #G or bA
  [5], // A
  [5, 6], // #A or bB
  [6], // B
  // Omit bC, as that is subtle with respect to octaves ...
];

// Process raw chord data (given in half-tone)
// distance from A_4 e.g. C_4 -> -9
// Raw is expected to be sorted ascending, such
// that the resulting arrays are sorted in a sensible
// was. (i.e. work with the SVG renderer)
function processRaw(raw) {
  const offset    = -9; // C4
  const names     = new Array(raw.length); // Letter name of note (C=0, D=1, ... B=6)
  const modifiers = new Array(raw.length); // Half-tone modification (-1 -> flat, 0 -> <none>, +1 -> sharp)
  const octaves   = new Array(raw.length); // Octaves for each note
  let   key       = null;

  // Determine key
  if (raw.length === 3) {
    // TODO: Add more (fancy) keys here ...
    // TODO: Recognize keys which might be in incorrect order ...
    if (raw[1] - raw[0] === 4 && raw[2] - raw[1] === 3)
      key = "major";
    if (raw[1] - raw[0] === 3 && raw[2] - raw[1] === 4)
      key = "minor";
  }

  // Take raw n and return octave
  const getOct = n => {
    const m = n - offset;
    return (m >= 0 ? Math.floor(m / 12) : -Math.ceil(-m / 12)) + 4;
  }
  const getTone = n => {
    const m = n - offset;
    return (120 + m) % 12; // -120 is lower than the lowest note on piano
  };

  // Name-finding strategy:
  // Greedily pick the lower one, if there is at
  // least one note gap between it and the previous
  let prev = -Infinity;
  for (let i = 0; i < raw.length; i ++) {
    const tone = getTone(raw[i]);
    if (nameMap[tone].length === 1) {
      names[i] = nameMap[tone][0];
      modifiers[i] = 0;
    } else {
      const [sharp, flat] = nameMap[tone];
      if (i === 0 || raw[i] - raw[i-1] >= 4) {
        names[i] = sharp;
        modifiers[i] = +1;
      } else {
        names[i] = flat;
        modifiers[i] = -1;
      }
    }
    octaves[i] = getOct(raw[i]);
  }

  return { key, names, modifiers, octaves };
}
