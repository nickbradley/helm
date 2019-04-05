declare module "*.vue" {
  import Vue from "vue"
  export default Vue
}

declare module "vue-async-computed" {
  // import { PluginFunction } from "vue";
  // interface IAsyncComputedOptions {
  //   errorHandler?: (error: string[]) => void;
  //   useRawError?: boolean;
  //   default?: any;
  // }

  export default class AsyncComputed {
    constructor(options?: any)
    static install: any;
    static version: string;
  }
}

//
// // This is a very rough interface which says, this object must be functions only
// // you could probably do better
// interface AsyncComputedObject{
//   [K : string]:()=>any;
// }
//
// // ComponentOptions is declared in types/options.d.ts
// declare module "vue/types/options" {
//   // enable async computed
//   interface ComponentOptions<V extends Vue> {
//     asyncComputed?: AsyncComputedObject;
//   }
// }

//
//
// import Vue, { PluginFunction } from "vue";
//

//
//
//
// type AsyncComputedGetter<T> = () => (Promise<T> | T);
// interface IAsyncComputedProperty<T> {
//   default?: T | (() => T);
//   get: AsyncComputedGetter<T>;
//   watch?: () => void;
//   shouldUpdate?: () => boolean;
//   lazy?: boolean;
// }
//
// interface IAsyncComputedProperties {
//   [K: string]: AsyncComputedGetter<any> | IAsyncComputedProperty<any>;
// }
//
// declare module "vue/types/options" {
//   // tslint:disable-next-line:interface-name
//   interface ComponentOptions<V extends Vue> {
//     asyncComputed?: IAsyncComputedProperties;
//   }
// }
//
// interface IASyncComputedState {
//   state: "updating" | "success" | "error";
//   updating: boolean;
//   success: boolean;
//   error: boolean;
//   exception: Error | null;
//   update: () => void;
// }
//
// declare module "vue/types/vue" {
//   // tslint:disable-next-line:interface-name
//   interface Vue {
//     $asyncComputed: {[K: string]: IASyncComputedState };
//   }
// }