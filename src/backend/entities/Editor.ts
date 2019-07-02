import { BaseEntity, Column, Entity, ManyToOne, ObjectLiteral, PrimaryGeneratedColumn } from "typeorm";
import { Tracker } from "./Tracker";

@Entity()
export class Editor extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("datetime")
  created: Date = new Date();

  @Column("int")
  duration: number = 0;

  @Column("text")
  file: string = "";

  @Column("text")
  project: string = "";

  @Column("text")
  language: string = "";

  @ManyToOne(type => Tracker, tracker => tracker.editors)
  tracker!: Tracker;

  public compareEvent(event: ObjectLiteral): boolean {
    return this.file === event.file &&
      this.project === event.project &&
      this.language === event.language
  }
}