## The Intersection Observer API

According to the MDN docs, “the Intersection Observer API provides a way to asynchronously observe changes in the intersection of a target element with an ancestor element or with a top-level document's viewport”.

This allows us to implement functions such as infinite scroll and image lazy loading

The intersection observer is created by calling its constructor and passing it a callback and an options object. The callback is called whenever one element, called the `target`, intersects either the device viewport or a specified element (specified in the options argument).

`let observer = new IntersectionObserver(callback, options);`

The API is very easy to use. Let's see a typical example

```javascript
var intObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      console.log(entry)
      console.log(entry.isIntersecting) // tells if the target intersects the root element
    })
  },
  {
    // default options
  }
);
let target = document.querySelector('#targetId');
intObserver.observe(target); // start observation
```

`entries` is a list of `IntersectionObserverEntry` objects. We iterate over the each entry (). A point worthy of note is that no time consuming task should be performed in the callback. You can read more about the API in the links provided in the resources section.

## Making API calls with the `useEffect` hook

To get started, clone the starter project from this url. It has minimal setup and a few styles defined. I've also added `Bootstrap` css in the `public/index.html` file as I'll be using Bootstrap classes for styling.
Feel free to create a new project if you like. Make sure you have `yarn` installed as well. You can get it from yarnpkg.

For this tutorial, we're going to be grabbing pictures from a public API and displaying them on the page. We'll load more pictures as the page scrolls. We will be using the Lorem Picsum https://picsum.photos/ APIs. Feel free to visit the site and see how easy it is to use their API.

For this tutorial we'll be using the following API endpoint, `https://picsum.photos/v2/list?page=2&limit=100`. This endpoint returns an array of picture objects. From here we can see that to get the next 100 pictures we simply change the value of page to 3. But first let's display 10 pictures from this endpoint.

Open up `src/App.js` and enter the following code

```javascript
import React, { useEffect, useReducer } from 'react';

import './index.css';

function App() {
  const imgReducer = (state, action) => {
    switch (action.type) {
      case 'STACK_IMAGES':
        return { ...state, images: state.images.concat(action.images) }
      case 'FETCHING_IMAGES':
        return { ...state, fetching: action.fetching }
      default:
        return state;
    }
  }

  const [imgData, imgDispatch] = useReducer(imgReducer, { images: [], fetching: true, })

  // make API calls
  useEffect(() => {
    imgDispatch({ type: 'FETCHING_IMAGES', fetching: true })
    fetch('https://picsum.photos/v2/list?page=0&limit=10')
      .then(data => data.json())
      .then(images => {
        imgDispatch({ type: 'STACK_IMAGES', images })
        imgDispatch({ type: 'FETCHING_IMAGES', fetching: true })
      })
      .catch(e => {
        console.error(e)
      })
  }, [ imgDispatch ])

  return (
    <div className="">
      <nav className="navbar bg-light">
        <div className="container">
          <a className="navbar-brand" href="/#">
            <h2>Infinite scroll + image lazy loading</h2>
          </a>
        </div>
      </nav>

      <div id='images' className="container">
        <div className="row">
          {imgData.images.map((image, index) => {
            const { author, download_url } = image
            return (
              <div key={index} className="card">
                <div className="card-body ">
                  <img
                    alt={author}
                    className="card-img-top"
                    src={download_url}
                  />
                </div>
                <div className="card-footer">
                  <p className="card-text text-center text-capitalize text-primary">Shot by: {author}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
```

The first thing we do is to define a reducer function which we'll call `imgReducer`. This reducer has two variables: images and fetching. The images variable is an array, while fetching is a boolean.
We then use this reducer in a useReducer hook, which in turns gives us back the updated reducer object as well as a function that we can call to update the reducer object.

We have defined two types of actions that this reducer will handle. The STACK_IMAGES action simply concatenates whatever array it receives onto the array that is already present in the reducer object. The FETCHING_IMAGES action type tells us whether the API call is still running or not. We put it on before starting the API call, and turn it off as soon as we get back the result of our API call.

To learn more about the useReducer hook please see the react documentation link in the resources section.

Inside the useEffect block we now make a call to the API endpoint using fetch. We then get the returned array and use it to update the images in our reducer.

To display the images we simply map over the images array in the imgData object.

Now start the app and view the page in the browser. You should see something similar to the picture below.

img-01-images-displayed

The corresponging branch at this point is 01-make-api-calls

## Implementing infinite scroll

Displaying the same set of images all the time gets boring and having to click to next page is not something most people like to do nowadays. Enter drumrolllllll!!! Infinite scrolling.

By observing the url of the API endpoint, <https://picsum.photos/v2/list?page=0&limit=10>, we find that to get the next 10 images we simply have to change the value of page to 1, so that we now make the API call to <https://picsum.photos/v2/list?page=1&limit=10>. Same for the next 10 images and so on. This implies that we need a way to increment the value of page each time we run out of pictures to display. We're not going to see how the Intersection Observer API helps us achieve that.

Open up `src/App.js`.

Write a new reducer below `imgReducer` and initialize it as shown below.

```javascript
// App.js

const imgReducer = (state, action) => {
  ...
}

const pageReducer = (state, action) => {
  switch (action.type) {
    case 'ADVANCE_PAGE':
      return { ...state, page: state.page + 1 }
    default:
      return state;
  }
}
const [ pager, pagerDispatch ] = useReducer(pageReducer, { page: 0 })
```

We define only one action type here. Each time the `ADVANCE_PAGE` action type is triggered, the value of `page` is incremented by 1.

Now, update the url in the `fetch` function to accept page numbers dynamically. Also update the dependency array.

```javascript
// App.js

useEffect(() => {
  ...
  fetch(`https://picsum.photos/v2/list?page=${pager.page}&limit=10`)
  ...
}, [ imgDispatch, pager.page ])
```

Just after the `useEffect` hook for the API call, enter the below code. Also update your imports line.

``` javascript
// App.js

import React, { useEffect, useReducer, useCallback, useRef } from 'react';

useEffect(() => {
  ...
}, [ imgDispatch, pager.page ])

// code block to add
// implement infinite scrolling with intersection observer
let bottomBoundaryRef = useRef(null);

const scrollObserver = useCallback(
  node => {
    new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.intersectionRatio > 0) {
          pagerDispatch({ type: 'ADVANCE_PAGE' });
        }
      });
    }).observe(node);
  },
  [pagerDispatch]
);

useEffect(() => {
  if (bottomBoundaryRef.current) {
    scrollObserver(bottomBoundaryRef.current);
  }
}, [scrollObserver, bottomBoundaryRef]);
```

Enter the below code after the `<div id='images'>` with id of images.

```javascript
// App.js

<div id='image'>
...
</div>

{imgData.fetching && (
  <div className="text-center bg-secondary m-auto p-3">
    <p className="m-0 text-white">Getting images</p>
  </div>
)}
<div id='page-bottom-boundary' style={{ border: '1px solid red' }} ref={bottomBoundaryRef}></div>
```

We define a variable `bottomBoundaryRef` and set its value to `useRef(null)`. `useRef` lets variables preserve their values between component renders. This means that the current value of the variable persists even if the component is re-rendered unless it is explicitly changed by re-assigning the `.current` property on that variable.

In our case `bottomBoundaryRef.current` starts out with a value of `null`. But as the page rendering cycle proceeds, we set its current property to be the node of the div `<div id='page-bottom-boundary'>`, via the assignment statement `ref={bottomBoundaryRef}`. React sets `bottomBoundaryRef.current` to the div on which this assignment is defined.

Next, we define a `scrollObserver` function. This is where we implement the intersection observer. We let this function dynamically accept a DOM node to observe. The main point to note here is that whenever the intersection of interest is reached, we dispatch the `ADVANCE_PAGE` action, whose effect is to increment the value of `pager.page` by 1. As soon as this happens, the `useEffect` block that has it as a dependency picks on it and re-runs the fetch call with the new page number.
We wrap the function in a `useCallback` hook to prevent un-ending component re-renders since we used `scrollObserver` in a `useEffect` hook. You can learn more about useCallback here.

Then we invoke `scrollObserver` passing in `bottomBoundaryRef.current`. Recall that `bottomBoundaryRef.current` refers to `<div id='page-bottom-boundary'>`. We also make sure that `bottomBoundaryRef.current` has a non-null value, otherwise the `IntersectionObserver` constructor would return an error.

We invoke this function inside a `useEffect` hook so that the function will be invoked only when any of the hook's dependencies changed. As it is now, the `scrollObserver` function is run only once i.e. when the value of `bottomBoundaryRef.current` is not null. If we didn't use a useEffect hook we will have the function invoked on every page re-render and go on and on and on.

Finally, when the API call is fired we show the text `Getting images`. As soon as it finishes we set `fetching` to false and the text is hidden again. We could display a loader or nothing at all if we wanted. The red boundary line at the end helps us see exactly when we hit the page boundary.

The corresponding branch at this point is `02-infinite-scroll`.

## Implementing image lazy loading

Currently, if you view the network tab as you scroll down, you'll see that as soon as you hit the bottom boundary (marked by a red line) and the API call is fired, all the images starts downloading even when you haven't even gotten to viewing them. There may also be some instances where image sizes are large and trying to load them all at once might slow the page down. These are some of the reasons for lazily loading images. This means that an image will not load until the user actively makes an attempt to view it by scrolling it into view.

Open up `src/App.js`

Just below the infinite scrolling functions, enter the following code

```javascript
// App.js

// implement infinite scrolling with intersection observer
let bottomBoundaryRef = useRef(null);
const scrollObserver = useCallback(
  ...
);
useEffect(() => {
  ...
}, [scrollObserver, bottomBoundaryRef]);


// code block to add
// lazy loads images with intersection observer
// only swap out the image source if the new url exists
const imagesRef = useRef(null);

const imgObserver = useCallback(node => {
  new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.intersectionRatio > 0) {
        const currentImg = en.target;
        const newImgSrc = currentImg.dataset.src;

        if (!newImgSrc) {
          console.error('Image source is invalid');
        } else {
          currentImg.src = newImgSrc;
        }
      }
    });
  }).observe(node);
}, []);

useEffect(() => {
  imagesRef.current = document.querySelectorAll('.card-img-top');

  if (imagesRef.current) {
    imagesRef.current.forEach(img => imgObserver(img));
  }
}, [imgObserver, imagesRef, imgData.images]);
```

As we did with `scrollObserver`, we define a function, `imgObserver` which accepts a node to observe. When an intersection is reached, as defined by `en.intersectionRatio > 0`, we swap out the image source on the element. Notice that we first check if the new image source is defined before doing that.

In the following `useEffect` block, we read all the images with class `.card-img-top` on the page with `document.querySelectorAll`. Then we iterate over each image and set up `imgObserver` on it.

Note that we added `imgData.images` as a dependency of the `useEffect` hook. When this changes it triggers the `useEffect` hook and in turn `imgObserver` is invoked on each `<img>` element.

Update the `<img/>` element as shown below.

```javascript
<img
  alt={author}
  data-src={download_url}
  className="card-img-top"
  src={'https://picsum.photos/id/870/300/300?grayscale&blur=2'}
/>
```

We set a default source for every `<img/>` and store the image we want to show on the `data-src` property. The default image is usually very small in size so that we're downloading as little as possible. The value on the `data-src` property is used to swap out the default image when it comes into view.

The corresponding branch at this point is `03-lazy-loading`.

## Abstracting fetch, infinite scroll and lazy loading into custom hooks

Now that we have implemented, fetch, infinite scroll and image lazy loading, it might happen that we have another component in our application that needs similar functionality. In that case we could find a way to abstract and reuse these functions. What we have to do is move them inside a separate file and import them when we need them. We want to extract them into custom hooks.
The React documentation defines a Custom Hook as a JavaScript function whose name starts with ”use” and that may call other Hooks. In our case we want to define three hooks, `useFetch`, `useInfiniteScroll`, `useLazyLoading`.

Create a file inside the `src/` folder and name it `customHooks.js`

Paste the code below inside it.

```javascript
import { useEffect, useCallback, useRef } from 'react';

// make API calls and pass the returned data via dispatch
export const useFetch = (data, dispatch) => {
  useEffect(() => {
    dispatch({ type: 'FETCHING_IMAGES', fetching: true })
    fetch(`https://picsum.photos/v2/list?page=${data.page}&limit=10`)
      .then(data => data.json())
      .then(images => {
        dispatch({ type: 'STACK_IMAGES', images })
        dispatch({ type: 'FETCHING_IMAGES', fetching: true })
      })
      .catch(e => {
        console.error(e)
      })
  }, [dispatch, data.page])
}

// infinite scrolling with intersection observer
export const useInfiniteScroll = (scrollRef, dispatch) => {
  const scrollObserver = useCallback(
    node => {
      new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.intersectionRatio > 0) {
            dispatch({ type: 'ADVANCE_PAGE' });
          }
        });
      }).observe(node);
    },
    [dispatch]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollObserver(scrollRef.current);
    }
  }, [scrollObserver, scrollRef]);
}

// lazy load images with intersection observer
export const useLazyLoading = (imgSelector, items) => {
  const imgObserver = useCallback(node => {
    new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.intersectionRatio > 0) {
          const currentImg = en.target;
          const newImgSrc = currentImg.dataset.src;

          // only swap out the image source if the new url exists
          if (!newImgSrc) {
            console.error('Image source is invalid');
          } else {
            currentImg.src = newImgSrc;
          }
        }
      });
    }).observe(node);
  }, []);

  const imagesRef = useRef(null);

  useEffect(() => {
    imagesRef.current = document.querySelectorAll(imgSelector);

    if (imagesRef.current) {
      imagesRef.current.forEach(img => imgObserver(img));
    }
  }, [imgObserver, imagesRef, imgSelector, items])
}
```

Open `src/App.js` and replace all the functions from first `useEffect` hook when we start making API calls down to just before the return statement with the code below

```javascript
// App.js

  ...

  // code to add
  let bottomBoundaryRef = useRef(null);
  useFetch(pager, imgDispatch);
  useLazyLoading('.card-img-top', imgData.images)
  useInfiniteScroll(bottomBoundaryRef, pagerDispatch);
  // code to add

  return (
    ...
  )
```

We can see that it is the same functions we have in `src/App.js` that we have extracted so we can pass some of the arguments dynamically.

The `useFetch` hook accepts a dispatch function and a data object. The dispatch function is used to send down the data from the API call to the component where it is defined. The data object is used to set update the API endpoint url.

The `useLazyLoading` hook receives a selector and an array. The selector is used to find the images while the array is used to trigger the useEffect hook that sets up the observer on each image.

The `useInfiniteScroll` hook accepts a `scrollRef` and a `dispatch` function. The `scrollRef` is used to set up the observer while the dispatch function is used to trigger an action that updates the page number in the API endpoint url.

The corresponding branch at this point is `04-custom-hooks`
