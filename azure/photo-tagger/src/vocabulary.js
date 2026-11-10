// Tag vocabulary for Marlin photos. Edit freely: the function reads this on every deploy.
// Venue codes match VENUE_SHORT_CODES in index.html, so tags line up with the rest of the OS.
export const VENUES = {
  LB: 'The Left Bank',
  RAV: 'The Ravenswood',
  WBC: 'Whitfords Brewing Co',
  HD: 'Hotel Darwin',
  MB: 'Mustang Bar',
  BL: 'Beerland Brewing',
};

// One main scene per photo.
export const SCENES = ['food', 'drink', 'people', 'venue-interior', 'venue-exterior', 'event', 'entertainment', 'sport', 'promo-artwork', 'other'];

// Preferred words for subjects. The model uses these where they fit and may add other specific,
// confidently visible items (e.g. "tasting paddle", "parma", "oysters").
export const PREFERRED_SUBJECTS = [
  'beer', 'craft beer', 'tasting paddle', 'pint', 'cocktail', 'wine', 'spritz', 'coffee', 'non-alcoholic',
  'burger', 'pizza', 'parma', 'steak', 'seafood', 'fish and chips', 'wings', 'share platter', 'dessert', 'kids meal',
  'bar', 'beer garden', 'dining room', 'function room', 'brewery', 'taps', 'tanks', 'signage',
  'live music', 'dj', 'trivia', 'big screen', 'sport screening', 'family', 'kids', 'dog friendly',
  'sunset', 'night', 'staff', 'chef', 'bartender', 'crowd',
];

export const MOODS = ['social', 'casual', 'celebration', 'relaxed', 'lively', 'family', 'premium', 'summer', 'winter'];
