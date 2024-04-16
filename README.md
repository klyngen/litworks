# Litworks - Lit element toolkit for making applications

The tooling and utils required to make an application using lit-elements powered by RXJS

## This small package contains the following 
- Simple but powerfull router
  - Capable of doing routing, sub-routing, even support auxiliary routing like patterns found in angular
- Directives and Async controller for connecting LIT-element and RXJS
  - A controller simplifying templating
  - A directive perfect for simple values like numbers and strings
- RXJS extensions for common operations
- Simple authentication


## Litworks router

This is a really simple and based on regex-patterns. It uses groups to extract parameter names. In it's simplest form you can use one global navigationService or you can have multiple routers. If you are building somehting big and complext, it might make sense to pass the navigation service arround using `@lit/context`.

- ✅ Supports lazy loading
- ✅ Multiple routers
- ✅ Angular style auxiliary routing
- ✅ URL parameters
- ✅ Query param based routing
- ✅ Subrouting

### Get Url parameters
1. First define a route containing a regex group 
`/\/products\/(?<productId>[0-9]+)$/`
2. Read the parameters using the observable found in the `NavigationService`
```typescript
navigationService.routeParams$.subscribe(params => console.log(params));
// { "productId": "42" }
```


### Example
The example below shows the most basic usage of the router

``` typescript
const navigationService = new NavigationService();
navigationService.addRoutes([
 { // This will lazy load a component
   name: "Route one",
   route: /\/one$/,
   action: () => {
     return import("./views/test-view/test-view.component");
   },
 },
 { // This will egarly load a component
   name: "Route two - egarly loaded component",
   route: /\/two$/,
   action: () => TestComponent,
 },
{ // This will lazy load a component
   name: "Route three - egarly loaded component with url params",
   route: /\/products\/(?<productId>[0-9]+)$/,
   action: () => TestComponent,
 },
]);
render() {
 return html`<litworks-router-outlet .navigationService=${navigationService}></litworks-router-outlet>`;
}
```

## Litworks RxJs tools
Litworks comes with some basic tools used to integrate better with RxJs

### AsyncController
Use the async-controller when you want to bind values more complex than a string or a number. Basically when handling arrays or objects. It can be used in tho ways, with value or using a render-function.

*Using the value directly*
``` typescript
import { interval } from "rxjs";

@customElement("test-component")
export class TestComponent extends LitElement {
   // Emits every second
   private interval$ = interval(1000); 
   
   private intervalController = createAsyncController(this, interval$, 0);
   
   render() {
     return html`<p>Current count: ${this.intervalController.value}</p>`;
   }
}
```


*Using the render function*
This is a very tidy way of making good frontend code. Here we are handling the various states with just a few linse of code
``` typescript
import { interval } from "rxjs";

@customElement("test-component")
export class TestComponent extends LitElement {
   // Emits every second
   private interval$ = interval(1000); 
   
   private intervalController = createAsyncController(this, interval$, 0);
   
   render() {
     return intervalController.render({
       onValue: (value) => html`Yay a value: ${value}`,
       onError: (err) => html`Oh s#!%, ${err}`,
       initial: () => html`TODO: Implement loading spinner`,
       pending: () => html`Loading state`,
       // Add onEmpty and an isEmpty function if you want an empty state
       onEmpty: () => html`Got an empty response`,
       // This function evaluates if a response is empty
       isEmpty: (value) => value === null
     });
   }
}
```

### Async directive

When you have an observable emitting a simple value, like a string or a number,
the observe-directive is probably the best way of tracking that single value
```typescript
@customElement("test-component")
export class TestComponent extends LitElement {
   // Emits every second
   private interval$ = interval(1000);

   render() {
     return html`<p>Current count: ${observe(this.interval$)}</p>`;
   }
}
```

## RxJs extensions

### fromKeyEvent
Makes it easiser to track keyEvents using RxJs. It's a thin wrapper arround the `fromEvent`-operator. It uses the keyup-event to track key-events.

``` typescript
// Listens to window
const key$ = fromKeyEvent(['A', 'B', 'C']);
const key2$ = fromKeyEvent(['A', 'B', 'C'], someHTMLElement);
```


### fromDragEvent
Library exposes a method making a drag and drop observable. Use this function whenever you want to make a simple interactive component.

``` typescript
// This observables emits how far the user has dragged on the X and Y axis.
// It is up to you how you apply this awesome data
const newElementPosition$ = fromDragEvent(someElement);
```

You can also pass some options.

``` typescript
// This observables emits how far the user has dragged on the X and Y axis.
// It is up to you how you apply this awesome data
const newElementPosition$ = fromDragEvent(someElement, {
  
});
```


### namedMerge
For the usecase when you have multiple observables emitting the same values and you want to distiguish the values.

Pass an object and use the keys as names
```typescript
namedMerge({
    a: interval(1000),
    b: interval(1100),
    c: interval(1200)
}).subscribe(console.log);
// { name: "a", value: 0 }
// { name: "b", value: 0 }
// { name: "c", value: 0 }
// { name: "a", value: 1 }
// { name: "b", value: 1 }
// { name: "c", value: 1 }
```

Pass an array of objects
 ```typescript
namedMerge([
{name: "a", observable: interval(1000)}
{name: "b", observable: interval(1001)}
{name: "c", observable: interval(1002)}
]).subscribe(console.log);
// { name: "a", value: 0 }
// { name: "b", value: 0 }
// { name: "c", value: 0 }
// { name: "a", value: 1 }
// { name: "b", value: 1 }
// { name: "c", value: 1 }
 ```


## Authentication
In most projects you end up using some sort of OIDC based flow. Having a stable source of user-details and access-token is essential when making a solid frontend application. Library includes a simple Authentication Service.

``` typescript
const authenticationService = new AuthenticationService({
  authority: 'authority',
  client_id: 'client_id',
  redirect_uri: 'something',
  scope: 'some scopes'
});

authenticationService.token$.subscribe(console.log);
authenticationService.user$.subscribe(console.log);
authenticationService.loginFlow();

// Will log out token and user when login is complete

```

## HttpClient
In most projects you want to fetch resources with authentication.
The httpClient provided in this library is very basic and is supposed to cover most use-cases. If it does not fit your needs. Copy the source code and hack it or extend it.

Client is just a thin wrapper arround `fromFetch`. Client just provides a authorization-header and some serialization.

``` typescript
const authenticationService = new AuthenticationService({
  authority: 'authority',
  client_id: 'client_id',
  redirect_uri: 'something',
  scope: 'some scopes'
});

var httpClient = new HttpClient(authenticationService.token$);

httpClient.fetchJson<MyResponse>('https://some-url-to-your-awesome-service.com').subscribe(console.log);

httpClient.fetchBlobImage('https://some-url-to-your-awesome-service.com').subscribe(console.log);
```

If a token-observable is not provided, the client still works.

## Want to simplify boilerplate code?
[Check out this project](https://github.com/klyngen/lit-gen)
