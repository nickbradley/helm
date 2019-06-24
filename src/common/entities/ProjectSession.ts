import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
  expression: `
    with recursive
    numbered as (
      select row_number() over (order by created) as rn,
             project,
             created,
             duration
      from editor
      ),
    project_session as (
      select 1 as session,
             rn,
             project,
             created,
             duration
      from numbered
      where rn = 1

      union all

      select case
               when ed.project == ps.project and
                    ed.created <= datetime(strftime('%s', ps.created) + ps.duration + 600, 'unixepoch')
                 then ps.session
               else ps.session + 1
               end,
             ed.rn,
             ed.project,
             ed.created,
             ed.duration
      from numbered ed
             join project_session ps on ed.rn = ps.rn + 1
      ),
    project_session_grouped as (
      select min(project)  as project,
             min(created)  as created,
             sum(duration) as duration
      from project_session
      group by session
      ),
    project_active_date as (
      select project,
             created as start,
                    case
                      when lead(created) over (order by created) <
                           datetime(strftime('%s', created) + duration + 600, 'unixepoch')
                        then datetime(lead(created) over (order by created))
                      else datetime(strftime('%s', created) + duration + 600, 'unixepoch') end as end
      from project_session_grouped
      )
      select * from project_active_date
  `
})
export class ProjectSession {
  @ViewColumn()
  project: string = "";

  @ViewColumn()
  start: Date = new Date();

  @ViewColumn()
  end: Date = new Date();
}