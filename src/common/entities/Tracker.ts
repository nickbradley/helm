import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Browser } from "./Browser";
import { Editor } from "./Editor";
import { Interaction } from "./Interaction";
import { Window } from "./Window";
import { Shell } from "./Shell";

@Entity()
export class Tracker extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // Note: key and id are switched from how they are used in ActivityWatch
  @Column("text")
  key: string = "";

  @Column("datetime")
  created: Date = new Date();

  @Column("text")
  type: string = "";

  @Column("text")
  client: string = "";

  @Column("text")
  hostname: string = "";

  @OneToMany(type => Browser, browser => browser.tracker)
  browsers!: Browser[];

  @OneToMany(type => Editor, editor => editor.tracker)
  editors!: Editor[];

  @OneToMany(type => Interaction, interaction => interaction.tracker)
  interactions!: Interaction[];

  @OneToMany(type => Shell, shell => shell.tracker)
  shells!: Shell[];

  @OneToMany(type => Window, window => window.tracker)
  windows!: Window[];
}