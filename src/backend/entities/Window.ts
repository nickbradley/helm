import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, ObjectLiteral } from "typeorm";
import { Tracker } from "./Tracker";

@Entity()
export class Window extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("datetime")
  created: Date = new Date();

  @Column("int")
  duration: number = 0;

  @Column("text")
  app: string = "";

  @Column("text")
  title: string = "";

  @ManyToOne(type => Tracker, tracker => tracker.windows)
  tracker!: Tracker;

  public compareEvent(event: ObjectLiteral): boolean {
    return this.app === event.app &&
      this.title === event.title
  }
}