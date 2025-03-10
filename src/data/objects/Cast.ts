export class Cast {
  character?: string;
  profileImage?: string;
  name?: string;

  constructor(
    name: string = "",
    character: string = "",
    profileImage: string = ""
  ) {
    this.name = name;
    this.character = character;
  }

  // Convert from JSON to Cast instance
  static fromJSON(json: any): Cast {
    return new Cast(
      json.name || "",
      json.character || "",
      json.profileImage || ""
    );
  }

  // Convert Cast instance to JSON
  toJSON(): any {
    return {
      name: this.name ?? "",
      character: this.character ?? "",
      profileImage: this.profileImage ?? "",
    };
  }
}
