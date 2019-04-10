import { BaseEntity, Column, Entity, ManyToOne, ObjectLiteral, PrimaryGeneratedColumn } from "typeorm";
import { Tracker } from "./Tracker";

@Entity()
export class Interaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("datetime")
  created: Date = new Date();

  @Column("int")
  duration: number = 0;

  @Column("boolean")
  afk: boolean = false;

  @ManyToOne(type => Tracker, tracker => tracker.interactions)
  tracker!: Tracker;

  public compareEvent(event: ObjectLiteral): boolean {
    return this.afk === event.afk
  }
}