# Design Opinions

Every application is designed with some opinions, even though we all try to be as objective as possible. I'm opening the floor to debate about this though, no opinion here is too sacred to throw to the fire, so tweet me [@alainxyz](https://twitter.com/alainxyz) if you have differing views here.

That being said, here's some of the opinions behind **Foilfolio**:

---

1. Don't want to be too opinionated, but the current implementation builds on React, MongoDB, Node.js, Express, Redux. I'm pretty settled on these for some really good reasons, some people might argue that you don't need mongo but to be honest, portfolios can be very heterogeneous so Mongo works really well in this use case. Some people might believe you can use Rust or C++ or Go as the backend and I agree there, I do have plans for a rust backend in the future. React goes without saying, Vue is basically angular, React is the best front end view library period. Redux is tried and tested, but there's been other libraries similar to it that may be easier to work with.

2. Some similar tools like Gatsby use GraphQL for querying posts. I think this is an extra level of indirection that makes things more complicated for no reason. I'm just using a simple JSON REST api.

3. Not including a user login system is a good thing, in fact I'd argue it's better than having one. One less password to keep track of. This does make this tool harder than other tools however. "Oh we have to do everything the Wordpress way!"

4. A big part of this system is asynchronous posts, so the app loads a thin and minimal client, then all other posts are loaded asynchronously via the API. This makes time to first paint really quick and keeps the application from taking too much space. (currently it's about 60kb)

Webpack lets you do something similar to where certain modules can be defined as split. This does however require that your entire app be centralized as Webpack needs to know where things are. This is good as it opens up ways to optimize splits since Webpack sees everything.

5. Currently this system has individual posts act as their own modules. These modules can query for data from the client application, have their own node.js dependencies, and run their own code. This does leave the door open for modules to include multiple copies of dependencies, but in practice I haven't seen that be an issue since you could bundle dependencies that are used by multiple modules in your core application.
