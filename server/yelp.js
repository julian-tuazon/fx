const fetch = require('node-fetch');
const apiKey = 'Bearer ' + process.env.YELP_API_KEY;

function gqlSearchRestaurants(lat, long, term, location, radius) {
  const loc = location
    ? `location: ${location}`
    : `latitude: ${lat}, longitude: ${long}`;

  return fetch('https://api.yelp.com/v3/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query: `{
          search(term: "${term}", ${loc}, radius: ${radius}, limit: 30) {
            restaurants: business {
              coordinates {
                latitude
                longitude
              }
              price
              photos
              id
              distance
              name
              rating
              location {
                city
                state
              }
              hours {
                open {
                  end
                  start
                  day
                }
              }
              reviews {
                text
                rating
                user {
                  name
                }
              }
            }
          }
        }`,
      }),
  })
    .then(response => response.json())
    .catch(error => console.error());
}

function gqlGetRestaurantDetails(yelpIds) {
  let gqlRestaurantQuery = '';
  for (let i = 0; i < yelpIds.length; i++) {
    const yelpId = yelpIds[i].yelpId;
    gqlRestaurantQuery += `
      a${i}: business(id: "${yelpId}") {
          ...restaurantDetails
      }
    `
  }
  return fetch('https://api.yelp.com/v3/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: `
      {
          ${gqlRestaurantQuery}
      }

          fragment restaurantDetails on Business {

                coordinates {
                  latitude
                  longitude
                }
                price
                photos
                id
                distance
                name
                rating
                location {
                  city
                  state
                }
                hours {
                  open {
                    end
                    start
                    day
                  }
                }
                reviews {
                  text
                  rating
                  user {
                    name
                  }
                }
          }
          `,
    }),
  })
    .then(response => response.json())
    .then(data => data.data)
    .catch(error => console.error());
}

function searchAllRestaurants(lat, long, term, location, radius) {
  return fetch((location
    ? `https://api.yelp.com/v3/businesses/search?location=${location}&term=${term}&radius=${radius}&limit=30`
    : `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${long}&radius=${radius}&term=${term}&limit=30`), {

    headers: {
      Authorization: apiKey
    }
  })
    .then(response => response.json())
    .then(data => {
      return data.businesses;
    });
}

const getRestaurantDetails = function (yelpId) {

  return fetch(`https://api.yelp.com/v3/businesses/${yelpId}`, {
    headers: {
      Authorization: apiKey
    }
  })
    .then(response => response.json())
    .then(details => {
      return getReviews(yelpId)
        .then(reviews => {
          details.reviews = reviews;
          return details;
        });
    });
};

const getReviews = function (yelpId) {
  return fetch(`https://api.yelp.com/v3/businesses/${yelpId}/reviews`, {
    headers: {
      Authorization: apiKey
    }
  })
    .then(response => response.json())
    .then(data => { return data.reviews; }
    );
};

module.exports = { getRestaurantDetails, searchAllRestaurants, gqlSearchRestaurants, gqlGetRestaurantDetails };
