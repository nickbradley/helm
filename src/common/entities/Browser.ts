import { BaseEntity, Column, Entity, ManyToOne, ObjectLiteral, PrimaryGeneratedColumn } from "typeorm";
import { Tracker } from "./Tracker";

@Entity()
export class Browser extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("datetime")
  created: Date = new Date();

  @Column("int")
  duration: number = 0;

  @Column("boolean")
  audible: boolean = false;

  @Column("text")
  url: string = "";

  @Column("text")
  title: string = "";

  @Column("boolean")
  incognito: boolean = false;

  @ManyToOne(type => Tracker, tracker => tracker.browsers)
  tracker!: Tracker;

  public compareEvent(event: ObjectLiteral): boolean {
    return this.audible === event.audible &&
      this.url === event.url &&
      this.title === event.title &&
      this.incognito === event.incognito;
  }
}
