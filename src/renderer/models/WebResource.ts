import {Resource} from "./Resource";
import {shell} from "electron";

export class WebResource extends Resource {

  constructor(record: any) {
    super(record);
  }

  public async open(): Promise<boolean> {
    // try activating the browser tab if it is already open
    let result = await super.open();
    if (!result) {
      // otherwise open URL in new tab
      result = shell.openExternal(this.reference);
    }

    return result;
  }
}