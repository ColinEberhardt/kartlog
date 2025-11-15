<script>
  import { push } from 'svelte-spa-router';
  import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
  import {
    formatDate,
    formatTime,
    formatFastestLap,
    formatTyrePressures,
    formatGearing,
    formatWeather,
    weatherCodeEmoji
  } from '../lib/sessionFormat.js';

  export let sessionsByDay = {}; // Object with day keys and arrays of sessions
  export let dayKeys = []; // Array of day keys in order to display

  const handleRowClick = (sessionId) => {
    push(`/sessions/view/${sessionId}`);
  };
</script>

<DataTable style="width: 100%;">
  <Head>
    <Row>
      <Cell class="col-time">Time</Cell>
      <Cell class="col-session">Session</Cell>
      <Cell class="col-weather">Weather</Cell>
      <Cell class="col-laps">Laps</Cell>
      <Cell class="col-fastest">Fastest</Cell>
    </Row>
  </Head>
  <Body>
    {#each dayKeys as dayKey}
      {@const daySessions = sessionsByDay[dayKey]}
      {@const firstSession = daySessions[0]}
      <!-- Day header row -->
      <Row class="day-header-row">
        <Cell colspan="5" class="day-header">
          <div class="day-header-content">
            <span class="day-date">📅 {formatDate(firstSession.date)}</span>
            <span class="day-track">📍 {firstSession.circuit || 'Unknown Circuit'}</span>
          </div>
        </Cell>
      </Row>
      <!-- Session rows for this day -->
      {#each daySessions as session (session.id)}
        <Row class="session-row">
          <div class="clickable-row" on:click={() => handleRowClick(session.id)} on:keydown={(e) => e.key === 'Enter' && handleRowClick(session.id)} tabindex="0" role="button">
            <Cell class="col-time">
              {formatTime(session.date)}
            </Cell>
            <Cell class="col-session">
              <div class="session-name">
                {#if session.isRace}
                  <span class="race-icon">🏁</span>
                {/if}
                {session.session}
              </div>
              {@const tyre = formatTyrePressures(session)}
              {@const gear = formatGearing(session)}
              <div class="session-details">
                {#if tyre !== '-'}🛞 {tyre}{/if}
                {#if tyre !== '-' && gear !== '-'} · {/if}
                {#if gear !== '-'}⚙️ {gear}{/if}
              </div>
              <div class="session-inline">
                <div class="inline-time">{formatTime(session.date)}</div>
                <div class="inline-weather">{weatherCodeEmoji(session.weatherCode)} {formatWeather(session)}°C</div>
              </div>
            </Cell>
            <Cell class="col-weather">
              {weatherCodeEmoji(session.weatherCode)} {formatWeather(session)}°C
            </Cell>
            <Cell class="col-laps">
              {session.laps}
              {#if session.isRace && session.startPos && session.endPos}
                {#key session.id}
                  {@const delta = session.startPos - session.endPos}
                  {@const deltaSign = delta > 0 ? '+' : ''}
                  <div class="session-details">
                    <span class="race-result">
                      {session.endPos}/{session.entries} 
                      <span class="delta {delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral'}">
                        ({deltaSign}{delta})
                      </span>
                      {#if session.penalties}
                        <span class="penalty-marker">*</span>
                      {/if}
                    </span>
                  </div>
                {/key}
              {/if}
            </Cell>
            <Cell class="col-fastest">
              {formatFastestLap(session.fastest)}
              {#if session.laps != null}
                <div class="inline-laps">{session.laps} laps</div>
              {/if}
            </Cell>
          </div>
        </Row>
      {/each}
    {/each}
  </Body>
</DataTable>
