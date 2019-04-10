import { BaseEntity, Column, Entity, ManyToOne, ObjectLiteral, PrimaryGeneratedColumn } from "typeorm";
import { Tracker } from "./Tracker";

@Entity()
export class Shell extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("datetime")
  created: Date = new Date();

  @Column("int")
  duration: number = 0;

  @Column("text")
  session: string = "";

  @Column("int")
  cmdNo: number = 0;

  @Column("text")
  cmdStr: string = "";

  @Column("text")
  cwd: string = "";

  @Column("int")
  code: number = -1;

  @ManyToOne(type => Tracker, tracker => tracker.shells)
  tracker!: Tracker;

  public compareEvent(event: ObjectLiteral): boolean {
    return this.session === event.session &&
      this.cmdNo === event.cmdNo &&
      this.cmdStr === event.cmdStr &&
      this.cwd === event.cwd &&
      this.code === event.code
  }
}
