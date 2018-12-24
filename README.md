# Finn

![avatar1](https://user-images.githubusercontent.com/13250888/50399532-74235300-07c3-11e9-8832-376a5cf0c69e.jpeg)

Cool!

## Usage

```typescript
import { AnimationRegistry, FlyInOutAnimationBehavior } from '@sj/finn';


const registry = new AnimationRegistry();

registry
    .setAnimationBehavior('flyInOut', FlyInOutAnimationBehavior)
    .setAnimationBehavior('customAnim', MyCustomAnimationBehavior);

registry.registerScrollReactAnimation({
    element: document.getElementById('ho'),
    behaviorId: 'flyInOut',
    offsetFallback: 'vertical',
    threshold: 0,
})
```


## License
MIT Licensed
