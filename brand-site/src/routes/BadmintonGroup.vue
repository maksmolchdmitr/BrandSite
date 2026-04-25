<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <div>
          <div class="crumbs">
            <RouterLink class="crumb" to="/?page=badminton&section=groups">{{ $t('badminton.groups.groups') }}</RouterLink>
            <span class="sep">/</span>
            <span class="crumb current">{{ groupId }}</span>
          </div>
          <h1 class="title">{{ group?.name || $t('badminton.groups.groupName') }}</h1>
        </div>

        <div class="topActions">
          <span v-if="group?.myRole" class="pill">{{ formatRole(group.myRole) }}</span>
          <button class="btn secondary" :disabled="loading" @click="refresh">{{ loading ? $t('common.actions.loading') : $t('common.actions.refresh') }}</button>
        </div>
      </div>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <nav class="groupNav">
        <RouterLink
          class="groupNavLink"
          :class="{ active: groupSection === 'participants' }"
          :to="`/?page=badminton&section=groups&groupId=${groupId}&groupSection=participants`"
        >
          {{ $t('badminton.group.participants') }}
        </RouterLink>
        <RouterLink
          class="groupNavLink"
          :class="{ active: groupSection === 'matches' }"
          :to="`/?page=badminton&section=groups&groupId=${groupId}&groupSection=matches`"
        >
          {{ $t('badminton.group.matches') }}
        </RouterLink>
        <RouterLink
          class="groupNavLink"
          :class="{ active: groupSection === 'leaderboards' }"
          :to="`/?page=badminton&section=groups&groupId=${groupId}&groupSection=leaderboards`"
        >
          {{ $t('badminton.group.leaderboards') }}
        </RouterLink>
      </nav>

      <div v-if="groupSection === 'participants'" class="grid">
        <div class="card">
          <div class="cardTitle">{{ $t('badminton.group.participants') }}</div>

          <div v-if="isAdmin" class="row">
            <input class="input" v-model="newParticipantName" :placeholder="$t('badminton.group.participantName')" />
            <button class="btn" :disabled="loadingAddParticipant || !newParticipantName" @click="addParticipant">
              {{ loadingAddParticipant ? $t('badminton.group.adding') : $t('common.actions.add') }}
            </button>
          </div>

          <div v-if="participants.length === 0" class="empty">{{ $t('badminton.group.noParticipants') }}</div>
          <div v-else>
            <div class="tableWrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>{{ $t('badminton.group.name') }}</th>
                    <th>{{ $t('badminton.group.userId') }}</th>
                    <th v-if="isAdmin">{{ $t('badminton.group.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in participants" :key="p.id">
                    <td class="nameCell">{{ p.name }}</td>
                    <td class="userIdCell">{{ p.userId || $t('common.misc.noData') }}</td>
                    <td v-if="isAdmin" class="actionsCell">
                      <button class="btn secondary small" @click="startEditParticipant(p)">{{ $t('common.actions.edit') }}</button>
                      <button class="btn secondary small" @click="startLinkUser(p)">{{ $t('common.actions.link') }}</button>
                      <button class="btn danger small" @click="removeParticipant(p)">{{ $t('common.actions.delete') }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagerRow">
              <button class="pagerButton" :disabled="!canGoPrevParticipants" @click="goPrevParticipants">←</button>
              <span class="pagerPage">{{ $t('common.pager.page', { page: participantsPageIndex + 1 }) }}</span>
              <button class="pagerButton" :disabled="!canGoNextParticipants" @click="goNextParticipants">→</button>
              <div class="pagerLimit">
                <span class="pagerLimitLabel">{{ $t('common.pager.perPage') }}</span>
                <div class="pagerLimitSelect" @click="toggleParticipantsLimitDropdown">
                  <span>{{ participantsLimit }}</span>
                  <span class="pagerLimitArrow">▾</span>
                  <div v-if="showParticipantsLimitDropdown" class="pagerLimitDropdown">
                    <div
                      v-for="opt in participantsLimitOptions"
                      :key="opt"
                      class="pagerLimitOption"
                      :class="{ active: opt === participantsLimit }"
                      @click.stop="changeParticipantsLimit(opt)"
                    >{{ opt }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="groupSection === 'matches'" class="card">
        <div class="cardTitle">{{ $t('badminton.group.matches') }}</div>
        <div v-if="isAdmin" class="row">
          <button class="btn" @click="openCreateMatch('singles')">+ {{ $t('badminton.group.singlesMatch') }}</button>
          <button class="btn" @click="openCreateMatch('doubles')">+ {{ $t('badminton.group.doublesMatch') }}</button>
        </div>
        <div v-if="singlesMatches.length === 0 && doublesMatches.length === 0" class="empty">{{ $t('badminton.group.noMatches') }}</div>
        <div v-if="singlesMatches.length > 0" class="matchSection">
          <div class="matchSectionTitle">{{ $t('badminton.group.singles') }}</div>
          <div class="tableWrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t('badminton.singles.player1') }}</th>
                  <th>{{ $t('badminton.singles.score') }}</th>
                  <th>{{ $t('badminton.singles.player2') }}</th>
                  <th>{{ $t('badminton.singles.score') }}</th>
                  <th>{{ $t('badminton.singles.date') }}</th>
                  <th v-if="isAdmin">{{ $t('badminton.group.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in singlesMatches" :key="m.id">
                  <td class="nameCell">{{ getParticipantName(m.teamA?.[0]) }}</td>
                  <td class="scoreCell" :class="{score21: getFinalScore(m, 'A') === 21}">{{ getFinalScore(m, 'A') }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamB?.[0]) }}</td>
                  <td class="scoreCell" :class="{score21: getFinalScore(m, 'B') === 21}">{{ getFinalScore(m, 'B') }}</td>
                  <td class="dateCell">{{ formatDate(m.startedAt) }}</td>
                  <td v-if="isAdmin" class="actionsCell">
                    <button class="btn secondary small" @click="openEditMatch(m)">{{ $t('common.actions.edit') }}</button>
                    <button class="btn danger small" @click="removeMatch(m)">{{ $t('common.actions.delete') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <PagerBar
            :current-page-index="singlesPageIndex"
            :can-go-prev="singlesPageIndex > 0"
            :can-go-next="canGoNextSingles"
            :limit="singlesLimit"
            :limit-options="matchesLimitOptions"
            :show-limit-dropdown="showSinglesLimitDropdown"
            @prev="goPrevSingles"
            @next="goNextSingles"
            @toggle-limit="showSinglesLimitDropdown = !showSinglesLimitDropdown"
            @change-limit="changeSinglesLimit"
          />
        </div>
        <div v-if="doublesMatches.length > 0" class="matchSection">
          <div class="matchSectionTitle">{{ $t('badminton.group.doubles') }}</div>
          <div class="tableWrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t('badminton.doubles.team1p1') }}</th>
                  <th>{{ $t('badminton.doubles.team1p2') }}</th>
                  <th>{{ $t('badminton.doubles.score') }}</th>
                  <th>{{ $t('badminton.doubles.team2p1') }}</th>
                  <th>{{ $t('badminton.doubles.team2p2') }}</th>
                  <th>{{ $t('badminton.doubles.score') }}</th>
                  <th>{{ $t('badminton.doubles.date') }}</th>
                  <th v-if="isAdmin">{{ $t('badminton.group.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in doublesMatches" :key="m.id">
                  <td class="nameCell">{{ getParticipantName(m.teamA?.[0]) }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamA?.[1]) }}</td>
                  <td class="scoreCell" :class="{score21: getFinalScore(m, 'A') === 21}">{{ getFinalScore(m, 'A') }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamB?.[0]) }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamB?.[1]) }}</td>
                  <td class="scoreCell" :class="{score21: getFinalScore(m, 'B') === 21}">{{ getFinalScore(m, 'B') }}</td>
                  <td class="dateCell">{{ formatDate(m.startedAt) }}</td>
                  <td v-if="isAdmin" class="actionsCell">
                    <button class="btn secondary small" @click="openEditMatch(m)">{{ $t('common.actions.edit') }}</button>
                    <button class="btn danger small" @click="removeMatch(m)">{{ $t('common.actions.delete') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <PagerBar
            :current-page-index="doublesPageIndex"
            :can-go-prev="doublesPageIndex > 0"
            :can-go-next="canGoNextDoubles"
            :limit="doublesLimit"
            :limit-options="matchesLimitOptions"
            :show-limit-dropdown="showDoublesLimitDropdown"
            @prev="goPrevDoubles"
            @next="goNextDoubles"
            @toggle-limit="showDoublesLimitDropdown = !showDoublesLimitDropdown"
            @change-limit="changeDoublesLimit"
          />
        </div>
      </div>

      <div v-if="groupSection === 'leaderboards'" class="card">
        <div class="cardTitle">{{ $t('badminton.group.leaderboards') }}</div>
        <div class="row">
          <button class="btn secondary" :disabled="loadingLb" @click="loadLeaderboards">
            {{ loadingLb ? $t('common.actions.loading') : $t('badminton.group.refreshLeaderboards') }}
          </button>
        </div>

        <div class="lbGrid">
          <div class="lbCard">
            <div class="lbTitle">{{ $t('badminton.group.singlesLeaderboard') }}</div>
            <div v-if="singlesLb.length === 0" class="empty">{{ $t('badminton.singles.empty') }}</div>
            <div v-else>
              <div class="tableWrapper">
                <table class="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{{ $t('badminton.ratings.player') }}</th>
                      <th>{{ $t('badminton.ratings.elo') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in singlesLb" :key="r.participantId">
                      <td class="rankCell">{{ r.rank }}</td>
                      <td class="nameCell">{{ r.participantName }}</td>
                      <td class="eloCell">{{ r.elo }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="pagerRow">
                <button class="pagerButton" :disabled="!canGoPrevSinglesLb" @click="goPrevSinglesLb">←</button>
                <span class="pagerPage">{{ $t('common.pager.page', { page: singlesLbPageIndex + 1 }) }}</span>
                <button class="pagerButton" :disabled="!canGoNextSinglesLb" @click="goNextSinglesLb">→</button>
                <div class="pagerLimit">
                  <span class="pagerLimitLabel">{{ $t('common.pager.perPage') }}</span>
                  <div class="pagerLimitSelect" @click="toggleSinglesLbLimitDropdown">
                    <span>{{ lbLimit }}</span>
                    <span class="pagerLimitArrow">▾</span>
                    <div v-if="showSinglesLbLimitDropdown" class="pagerLimitDropdown">
                      <div
                        v-for="opt in lbLimitOptions"
                        :key="'s'+opt"
                        class="pagerLimitOption"
                        :class="{ active: opt === lbLimit }"
                        @click.stop="changeLbLimit(opt, 'singles')"
                      >{{ opt }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="lbCard">
            <div class="lbTitle">{{ $t('badminton.group.doublesLeaderboard') }}</div>
            <div v-if="doublesLb.length === 0" class="empty">{{ $t('badminton.doubles.empty') }}</div>
            <div v-else>
              <div class="tableWrapper">
                <table class="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{{ $t('badminton.group.team') }}</th>
                      <th>{{ $t('badminton.ratings.elo') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in doublesLb" :key="r.pairKey">
                      <td class="rankCell">{{ r.rank }}</td>
                      <td class="nameCell">{{ (r.participantNames || []).join(" + ") }}</td>
                      <td class="eloCell">{{ r.elo }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="pagerRow">
                <button class="pagerButton" :disabled="!canGoPrevDoublesLb" @click="goPrevDoublesLb">←</button>
                <span class="pagerPage">{{ $t('common.pager.page', { page: doublesLbPageIndex + 1 }) }}</span>
                <button class="pagerButton" :disabled="!canGoNextDoublesLb" @click="goNextDoublesLb">→</button>
                <div class="pagerLimit">
                  <span class="pagerLimitLabel">{{ $t('common.pager.perPage') }}</span>
                  <div class="pagerLimitSelect" @click="toggleDoublesLbLimitDropdown">
                    <span>{{ lbLimit }}</span>
                    <span class="pagerLimitArrow">▾</span>
                    <div v-if="showDoublesLbLimitDropdown" class="pagerLimitDropdown">
                      <div
                        v-for="opt in lbLimitOptions"
                        :key="'d'+opt"
                        class="pagerLimitOption"
                        :class="{ active: opt === lbLimit }"
                        @click.stop="changeLbLimit(opt, 'doubles')"
                      >{{ opt }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals (participants: edit/link; matches: create/edit match) -->
      <div v-if="modal.type" class="modalOverlay" @click.self="closeModal">
        <div class="modal">
          <div class="modalTitle">{{ modalTitle }}</div>

          <!-- Edit participant -->
          <div v-if="modal.type === 'editParticipant'" class="modalBody">
            <input class="input" v-model="modal.payload.name" :placeholder="$t('badminton.group.name')" />
            <div class="row">
              <button class="btn" :disabled="modalLoading" @click="saveParticipantEdit">{{ $t('common.actions.save') }}</button>
              <button class="btn secondary" :disabled="modalLoading" @click="closeModal">{{ $t('common.actions.cancel') }}</button>
            </div>
          </div>

          <!-- Link user -->
          <div v-else-if="modal.type === 'linkUser'" class="modalBody">
            <input class="input" v-model="modal.payload.userId" :placeholder="$t('badminton.group.userId')" />
            <div class="row">
              <button class="btn" :disabled="modalLoading || !modal.payload.userId" @click="confirmLinkUser">{{ $t('common.actions.link') }}</button>
              <button class="btn secondary" :disabled="modalLoading" @click="closeModal">{{ $t('common.actions.cancel') }}</button>
            </div>
          </div>

          <!-- Create/Edit match -->
          <div v-else-if="modal.type === 'match'" class="modalBody">
            <!-- Singles match form -->
            <div v-if="modal.payload.kind === 'singles'" class="matchForm">
              <div class="formSection">
                <div class="sectionTitle">{{ $t('badminton.group.team1') }}</div>
                <div v-if="!modal.payload.team1P1" class="participantSearch">
                  <input 
                    class="input" 
                    v-model="modal.payload.searchTeam1P1" 
                    @input="searchParticipantsField('team1P1')"
                    @focus="loadParticipantsPage('team1P1', 0)"
                    :placeholder="$t('common.placeholders.searchParticipant')"
                    autocomplete="off"
                  />
                  <div 
                    v-if="getParticipantsList('team1P1').items.length > 0 || getParticipantsList('team1P1').loading" 
                    class="dropdown"
                    @scroll="handleScroll('team1P1', $event)"
                  >
                    <div v-if="getParticipantsList('team1P1').loading && getParticipantsList('team1P1').page === 0" class="dropdownItem">{{ $t('common.actions.loading') }}</div>
                    <div 
                      v-for="p in getParticipantsList('team1P1').items" 
                      :key="p.id"
                      class="dropdownItem"
                      @click="selectParticipant('team1P1', p)"
                    >
                      {{ p.name }}
                    </div>
                    <div v-if="getParticipantsList('team1P1').loading && getParticipantsList('team1P1').page > 0" class="dropdownItem">{{ $t('badminton.group.loadingMore') }}</div>
                  </div>
                </div>
                <div v-if="modal.payload.team1P1" class="selectedParticipant">
                  {{ getParticipantName(modal.payload.team1P1) }}
                  <button class="btn small danger" @click="modal.payload.team1P1 = null; modal.payload.searchTeam1P1 = ''">×</button>
                </div>
                
                <div class="scoresRow">
                  <div class="scoresLabel">{{ $t('badminton.group.scores') }}:</div>
                  <div class="scoresInputs">
                    <div v-for="(score, idx) in modal.payload.team1Scores" :key="idx" class="scoreInputWrapper">
                      <input 
                        type="number" 
                        class="scoreInput" 
                        v-model.number="modal.payload.team1Scores[idx]" 
                        :placeholder="$t('badminton.group.scorePlaceholder')"
                        min="0"
                        max="30"
                      />
                      <button 
                        v-if="modal.payload.team1Scores.length > 1" 
                        class="btn small danger scoreRemoveBtn" 
                        @click="removeScore('team1', idx)"
                        :title="$t('badminton.group.removeScore')"
                      >×</button>
                    </div>
                    <button class="btn small secondary" @click="addScore('team1')">+</button>
                  </div>
                </div>
              </div>

              <div class="formSection">
                <div class="sectionTitle">{{ $t('badminton.group.team2') }}</div>
                <div v-if="!modal.payload.team2P1" class="participantSearch">
                  <input 
                    class="input" 
                    v-model="modal.payload.searchTeam2P1" 
                    @input="searchParticipantsField('team2P1')"
                    @focus="loadParticipantsPage('team2P1', 0)"
                    :placeholder="$t('common.placeholders.searchParticipant')"
                    autocomplete="off"
                  />
                  <div 
                    v-if="getParticipantsList('team2P1').items.length > 0 || getParticipantsList('team2P1').loading" 
                    class="dropdown"
                    @scroll="handleScroll('team2P1', $event)"
                  >
                    <div v-if="getParticipantsList('team2P1').loading && getParticipantsList('team2P1').page === 0" class="dropdownItem">{{ $t('common.actions.loading') }}</div>
                    <div 
                      v-for="p in getParticipantsList('team2P1').items" 
                      :key="p.id"
                      class="dropdownItem"
                      @click="selectParticipant('team2P1', p)"
                    >
                      {{ p.name }}
                    </div>
                    <div v-if="getParticipantsList('team2P1').loading && getParticipantsList('team2P1').page > 0" class="dropdownItem">{{ $t('badminton.group.loadingMore') }}</div>
                  </div>
                </div>
                <div v-if="modal.payload.team2P1" class="selectedParticipant">
                  {{ getParticipantName(modal.payload.team2P1) }}
                  <button class="btn small danger" @click="modal.payload.team2P1 = null; modal.payload.searchTeam2P1 = ''">×</button>
                </div>
                
                <div class="scoresRow">
                  <div class="scoresLabel">{{ $t('badminton.group.scores') }}:</div>
                  <div class="scoresInputs">
                    <div v-for="(score, idx) in modal.payload.team2Scores" :key="idx" class="scoreInputWrapper">
                      <input 
                        type="number" 
                        class="scoreInput" 
                        v-model.number="modal.payload.team2Scores[idx]" 
                        :placeholder="$t('badminton.group.scorePlaceholder')"
                        min="0"
                        max="30"
                      />
                      <button 
                        v-if="modal.payload.team2Scores.length > 1" 
                        class="btn small danger scoreRemoveBtn" 
                        @click="removeScore('team2', idx)"
                        :title="$t('badminton.group.removeScore')"
                      >×</button>
                    </div>
                    <button class="btn small secondary" @click="addScore('team2')">+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Doubles match form -->
            <div v-else class="matchForm">
              <div class="formSection">
                <div class="sectionTitle">{{ $t('badminton.group.team1') }}</div>
                <div v-if="!modal.payload.team1P1" class="participantSearch">
                  <input 
                    class="input" 
                    v-model="modal.payload.searchTeam1P1" 
                    @input="searchParticipantsField('team1P1')"
                    @focus="loadParticipantsPage('team1P1', 0)"
                    :placeholder="$t('common.placeholders.searchParticipant1')"
                    autocomplete="off"
                  />
                  <div 
                    v-if="getParticipantsList('team1P1').items.length > 0 || getParticipantsList('team1P1').loading" 
                    class="dropdown"
                    @scroll="handleScroll('team1P1', $event)"
                  >
                    <div v-if="getParticipantsList('team1P1').loading && getParticipantsList('team1P1').page === 0" class="dropdownItem">{{ $t('common.actions.loading') }}</div>
                    <div 
                      v-for="p in getParticipantsList('team1P1').items" 
                      :key="p.id"
                      class="dropdownItem"
                      @click="selectParticipant('team1P1', p)"
                    >
                      {{ p.name }}
                    </div>
                    <div v-if="getParticipantsList('team1P1').loading && getParticipantsList('team1P1').page > 0" class="dropdownItem">{{ $t('badminton.group.loadingMore') }}</div>
                  </div>
                </div>
                <div v-if="modal.payload.team1P1" class="selectedParticipant">
                  {{ getParticipantName(modal.payload.team1P1) }}
                  <button class="btn small danger" @click="modal.payload.team1P1 = null; modal.payload.searchTeam1P1 = ''">×</button>
                </div>

                <div v-if="!modal.payload.team1P2" class="participantSearch">
                  <input 
                    class="input" 
                    v-model="modal.payload.searchTeam1P2" 
                    @input="searchParticipantsField('team1P2')"
                    @focus="loadParticipantsPage('team1P2', 0)"
                    :placeholder="$t('common.placeholders.searchParticipant2')"
                    autocomplete="off"
                  />
                  <div v-if="getParticipantsList('team1P2').items.length > 0 || getParticipantsList('team1P2').loading" class="dropdown">
                    <div v-if="getParticipantsList('team1P2').loading" class="dropdownItem">{{ $t('common.actions.loading') }}</div>
                    <div 
                      v-for="p in getParticipantsList('team1P2').items" 
                      :key="p.id"
                      class="dropdownItem"
                      @click="selectParticipant('team1P2', p)"
                    >
                      {{ p.name }}
                    </div>
                  </div>
                </div>
                <div v-if="modal.payload.team1P2" class="selectedParticipant">
                  {{ getParticipantName(modal.payload.team1P2) }}
                  <button class="btn small danger" @click="modal.payload.team1P2 = null; modal.payload.searchTeam1P2 = ''">×</button>
                </div>
                
                <div class="scoresRow">
                  <div class="scoresLabel">{{ $t('badminton.group.scores') }}:</div>
                  <div class="scoresInputs">
                    <div v-for="(score, idx) in modal.payload.team1Scores" :key="idx" class="scoreInputWrapper">
                      <input 
                        type="number" 
                        class="scoreInput" 
                        v-model.number="modal.payload.team1Scores[idx]" 
                        :placeholder="$t('badminton.group.scorePlaceholder')"
                        min="0"
                        max="30"
                      />
                      <button 
                        v-if="modal.payload.team1Scores.length > 1" 
                        class="btn small danger scoreRemoveBtn" 
                        @click="removeScore('team1', idx)"
                        :title="$t('badminton.group.removeScore')"
                      >×</button>
                    </div>
                    <button class="btn small secondary" @click="addScore('team1')">+</button>
                  </div>
                </div>
              </div>

              <div class="formSection">
                <div class="sectionTitle">{{ $t('badminton.group.team2') }}</div>
                <div v-if="!modal.payload.team2P1" class="participantSearch">
                  <input 
                    class="input" 
                    v-model="modal.payload.searchTeam2P1" 
                    @input="searchParticipantsField('team2P1')"
                    @focus="loadParticipantsPage('team2P1', 0)"
                    :placeholder="$t('common.placeholders.searchParticipant1')"
                    autocomplete="off"
                  />
                  <div v-if="getParticipantsList('team2P1').items.length > 0 || getParticipantsList('team2P1').loading" class="dropdown">
                    <div v-if="getParticipantsList('team2P1').loading" class="dropdownItem">{{ $t('common.actions.loading') }}</div>
                    <div 
                      v-for="p in getParticipantsList('team2P1').items" 
                      :key="p.id"
                      class="dropdownItem"
                      @click="selectParticipant('team2P1', p)"
                    >
                      {{ p.name }}
                    </div>
                  </div>
                </div>
                <div v-if="modal.payload.team2P1" class="selectedParticipant">
                  {{ getParticipantName(modal.payload.team2P1) }}
                  <button class="btn small danger" @click="modal.payload.team2P1 = null; modal.payload.searchTeam2P1 = ''">×</button>
                </div>

                <div v-if="!modal.payload.team2P2" class="participantSearch">
                  <input 
                    class="input" 
                    v-model="modal.payload.searchTeam2P2" 
                    @input="searchParticipantsField('team2P2')"
                    @focus="loadParticipantsPage('team2P2', 0)"
                    :placeholder="$t('common.placeholders.searchParticipant2')"
                    autocomplete="off"
                  />
                  <div 
                    v-if="getParticipantsList('team2P2').items.length > 0 || getParticipantsList('team2P2').loading" 
                    class="dropdown"
                    @scroll="handleScroll('team2P2', $event)"
                  >
                    <div v-if="getParticipantsList('team2P2').loading && getParticipantsList('team2P2').page === 0" class="dropdownItem">{{ $t('common.actions.loading') }}</div>
                    <div 
                      v-for="p in getParticipantsList('team2P2').items" 
                      :key="p.id"
                      class="dropdownItem"
                      @click="selectParticipant('team2P2', p)"
                    >
                      {{ p.name }}
                    </div>
                    <div v-if="getParticipantsList('team2P2').loading && getParticipantsList('team2P2').page > 0" class="dropdownItem">{{ $t('badminton.group.loadingMore') }}</div>
                  </div>
                </div>
                <div v-if="modal.payload.team2P2" class="selectedParticipant">
                  {{ getParticipantName(modal.payload.team2P2) }}
                  <button class="btn small danger" @click="modal.payload.team2P2 = null; modal.payload.searchTeam2P2 = ''">×</button>
                </div>
                
                <div class="scoresRow">
                  <div class="scoresLabel">{{ $t('badminton.group.scores') }}:</div>
                  <div class="scoresInputs">
                    <div v-for="(score, idx) in modal.payload.team2Scores" :key="idx" class="scoreInputWrapper">
                      <input 
                        type="number" 
                        class="scoreInput" 
                        v-model.number="modal.payload.team2Scores[idx]" 
                        :placeholder="$t('badminton.group.scorePlaceholder')"
                        min="0"
                        max="30"
                      />
                      <button 
                        v-if="modal.payload.team2Scores.length > 1" 
                        class="btn small danger scoreRemoveBtn" 
                        @click="removeScore('team2', idx)"
                        :title="$t('badminton.group.removeScore')"
                      >×</button>
                    </div>
                    <button class="btn small secondary" @click="addScore('team2')">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="row">
              <button class="btn" :disabled="modalLoading || !canSaveMatch" @click="saveMatch">
                {{ modal.payload.matchId ? $t('common.actions.save') : $t('common.actions.create') }}
              </button>
              <button class="btn secondary" :disabled="modalLoading" @click="closeModal">{{ $t('common.actions.cancel') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import HeadBar from "@/components/HeadBar.vue";
import PagerBar from "@/components/badminton/PagerBar.vue";
import { badmintonClient } from "@/badminton/client.js";

export default defineComponent({
  name: "BadmintonGroup",
  components: { HeadBar, PagerBar },
  props: {
    groupId: { type: String, required: true },
    groupSection: { type: String, default: "participants" },
  },
  data() {
    return {
      loading: false,
      error: "",
      group: null,
      participantNameMap: {},
      participantsPages: [],
      participantsPageIndex: 0,
      participantsLimit: 10,
      participantsLimitOptions: [10, 20, 50],
      showParticipantsLimitDropdown: false,

      singlesPages: [],
      singlesPageIndex: 0,
      singlesLimit: 10,
      showSinglesLimitDropdown: false,
      doublesPages: [],
      doublesPageIndex: 0,
      doublesLimit: 10,
      showDoublesLimitDropdown: false,
      matchesLimitOptions: [10, 20, 50],

      singlesLbPages: [],
      singlesLbPageIndex: 0,
      doublesLbPages: [],
      doublesLbPageIndex: 0,
      lbLimit: 10,
      lbLimitOptions: [10, 20, 50],
      showSinglesLbLimitDropdown: false,
      showDoublesLbLimitDropdown: false,
      loadingLb: false,

      newParticipantName: "",
      loadingAddParticipant: false,

      modal: {type: "", payload: {}},
      modalLoading: false,
      
      // Participant search pagination state for each field
      participantSearchState: {
        team1P1: {items: [], page: 0, hasMore: false, loading: false},
        team1P2: {items: [], page: 0, hasMore: false, loading: false},
        team2P1: {items: [], page: 0, hasMore: false, loading: false},
        team2P2: {items: [], page: 0, hasMore: false, loading: false},
      },
    };
  },
  computed: {
    localizedHeadItems() {
      return [
        { text: this.$t("common.nav.main"), ref: "/?page=main", isMainSwitch: false },
        { text: this.$t("common.nav.products"), ref: "/?page=products", isMainSwitch: false },
        { text: this.$t("common.nav.badminton"), ref: "/?page=badminton&section=ratings", isMainSwitch: true },
      ];
    },
    isAdmin() {
      return this.group?.myRole === "admin";
    },
    modalTitle() {
      if (this.modal.type === "editParticipant") return this.$t("badminton.group.editParticipant");
      if (this.modal.type === "linkUser") return this.$t("badminton.group.linkUser");
      if (this.modal.type === "match") {
        const kind = this.modal.payload.kind === "singles" ? this.$t("badminton.group.singles") : this.$t("badminton.group.doubles");
        return this.modal.payload.matchId ? this.$t("badminton.group.editMatch", { kind }) : this.$t("badminton.group.createMatch", { kind });
      }
      return "";
    },
    canSaveMatch() {
      const p = this.modal.payload;
      if (p.kind === "singles") {
        return p.team1P1 && p.team2P1 && 
               p.team1Scores.some(s => s > 0) && 
               p.team2Scores.some(s => s > 0);
      } else {
        return p.team1P1 && p.team1P2 && p.team2P1 && p.team2P2 &&
               p.team1Scores.some(s => s > 0) && 
               p.team2Scores.some(s => s > 0);
      }
    },
    currentParticipantsPage() {
      if (!this.participantsPages.length) return { items: [], pageToken: null };
      return this.participantsPages[this.participantsPageIndex] || { items: [], pageToken: null };
    },
    participants() {
      return this.currentParticipantsPage.items || [];
    },
    canGoPrevParticipants() {
      return this.participantsPageIndex > 0;
    },
    canGoNextParticipants() {
      const page = this.currentParticipantsPage;
      const n = (page.items || []).length;
      if (n < this.participantsLimit && this.participantsPageIndex === 0) return false;
      if (n < this.participantsLimit && this.participantsPageIndex > 0) return false;
      return !!page.pageToken;
    },
    currentSinglesPage() {
      if (!this.singlesPages.length) return { items: [], pageToken: null };
      return this.singlesPages[this.singlesPageIndex] || { items: [], pageToken: null };
    },
    currentDoublesPage() {
      if (!this.doublesPages.length) return { items: [], pageToken: null };
      return this.doublesPages[this.doublesPageIndex] || { items: [], pageToken: null };
    },
    singlesMatches() {
      return this.currentSinglesPage.items || [];
    },
    doublesMatches() {
      return this.currentDoublesPage.items || [];
    },
    canGoNextSingles() {
      const page = this.currentSinglesPage;
      const n = (page.items || []).length;
      if (n < this.singlesLimit && this.singlesPageIndex === 0) return false;
      if (n < this.singlesLimit && this.singlesPageIndex > 0) return false;
      return !!page.pageToken;
    },
    canGoNextDoubles() {
      const page = this.currentDoublesPage;
      const n = (page.items || []).length;
      if (n < this.doublesLimit && this.doublesPageIndex === 0) return false;
      if (n < this.doublesLimit && this.doublesPageIndex > 0) return false;
      return !!page.pageToken;
    },
    currentSinglesLbPage() {
      if (!this.singlesLbPages.length) return { items: [], pageToken: null };
      return this.singlesLbPages[this.singlesLbPageIndex] || { items: [], pageToken: null };
    },
    currentDoublesLbPage() {
      if (!this.doublesLbPages.length) return { items: [], pageToken: null };
      return this.doublesLbPages[this.doublesLbPageIndex] || { items: [], pageToken: null };
    },
    singlesLb() {
      return this.currentSinglesLbPage.items || [];
    },
    doublesLb() {
      return this.currentDoublesLbPage.items || [];
    },
    canGoPrevSinglesLb() {
      return this.singlesLbPageIndex > 0;
    },
    canGoNextSinglesLb() {
      const page = this.currentSinglesLbPage;
      const n = (page.items || []).length;
      if (n < this.lbLimit && this.singlesLbPageIndex === 0) return false;
      if (n < this.lbLimit && this.singlesLbPageIndex > 0) return false;
      return !!page.pageToken;
    },
    canGoPrevDoublesLb() {
      return this.doublesLbPageIndex > 0;
    },
    canGoNextDoublesLb() {
      const page = this.currentDoublesLbPage;
      const n = (page.items || []).length;
      if (n < this.lbLimit && this.doublesLbPageIndex === 0) return false;
      if (n < this.lbLimit && this.doublesLbPageIndex > 0) return false;
      return !!page.pageToken;
    },
  },
  watch: {
    groupSection() {
      this.loadSection();
    },
    groupId() {
      this.loadGroup();
      this.loadSection();
    },
  },
  mounted() {
    this.loadGroup().then(() => this.loadSection());
  },
  methods: {
    mergeParticipantNames(items) {
      const map = { ...this.participantNameMap };
      (items || []).forEach(p => { map[p.id] = p.name; });
      this.participantNameMap = map;
    },
    formatRole(role) {
      if (role === "admin") return this.$t("badminton.roles.admin");
      if (role === "member") return this.$t("badminton.roles.member");
      return role;
    },
    async loadGroup() {
      this.loading = true;
      this.error = "";
      try {
        this.group = await badmintonClient.getGroup(this.groupId);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLoadGroup");
      } finally {
        this.loading = false;
      }
    },
    async loadSection() {
      if (!this.groupId) return;
      this.loading = true;
      this.error = "";
      try {
        if (this.groupSection === "participants") {
          const res = await badmintonClient.listParticipants(this.groupId, { limit: this.participantsLimit });
          const pItems = res?.items || [];
          this.participantsPages = [{ items: pItems, pageToken: res?.pageToken || null }];
          this.participantsPageIndex = 0;
          this.mergeParticipantNames(pItems);
        } else if (this.groupSection === "matches") {
          const [participantsRes, singlesRes, doublesRes] = await Promise.all([
            badmintonClient.listParticipants(this.groupId, { limit: 500 }),
            badmintonClient.listMatches(this.groupId, { kind: "singles", limit: this.singlesLimit }),
            badmintonClient.listMatches(this.groupId, { kind: "doubles", limit: this.doublesLimit }),
          ]);
          this.mergeParticipantNames(participantsRes?.items || []);
          this.singlesPages = [{ items: singlesRes?.items || [], pageToken: singlesRes?.pageToken || null }];
          this.singlesPageIndex = 0;
          this.doublesPages = [{ items: doublesRes?.items || [], pageToken: doublesRes?.pageToken || null }];
          this.doublesPageIndex = 0;
        } else if (this.groupSection === "leaderboards") {
          await this.loadLeaderboards();
        }
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLoad");
      } finally {
        this.loading = false;
      }
    },
    async goPrevParticipants() {
      if (!this.canGoPrevParticipants) return;
      this.participantsPageIndex = Math.max(0, this.participantsPageIndex - 1);
    },
    async goNextParticipants() {
      if (!this.canGoNextParticipants) return;
      const current = this.currentParticipantsPage;
      const nextToken = current.pageToken;
      if (!nextToken) return;
      const existingIndex = this.participantsPages.findIndex(
        (p, idx) => idx > this.participantsPageIndex && p.pageTokenFrom === nextToken
      );
      if (existingIndex !== -1) {
        this.participantsPageIndex = existingIndex;
        return;
      }
      this.loading = true;
      try {
        const res = await badmintonClient.listParticipants(this.groupId, { limit: this.participantsLimit, pageToken: nextToken });
        const page = { items: res?.items || [], pageToken: res?.pageToken || null, pageTokenFrom: nextToken };
        this.participantsPages.push(page);
        this.participantsPageIndex = this.participantsPages.length - 1;
        this.mergeParticipantNames(page.items);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errNextPage");
      } finally {
        this.loading = false;
      }
    },
    toggleParticipantsLimitDropdown() {
      this.showParticipantsLimitDropdown = !this.showParticipantsLimitDropdown;
    },
    async changeParticipantsLimit(limit) {
      if (this.participantsLimit === limit) {
        this.showParticipantsLimitDropdown = false;
        return;
      }
      this.participantsLimit = limit;
      this.showParticipantsLimitDropdown = false;
      this.loading = true;
      try {
        const res = await badmintonClient.listParticipants(this.groupId, { limit });
        const pItems = res?.items || [];
        this.participantsPages = [{ items: pItems, pageToken: res?.pageToken || null }];
        this.participantsPageIndex = 0;
        this.mergeParticipantNames(pItems);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLoad");
      } finally {
        this.loading = false;
      }
    },
    refresh() {
      this.loadGroup();
      this.loadSection();
    },
    async goPrevSingles() {
      if (this.singlesPageIndex > 0) this.singlesPageIndex--;
    },
    async goNextSingles() {
      const current = this.currentSinglesPage;
      const nextToken = current.pageToken;
      if (!nextToken) return;
      const existing = this.singlesPages.findIndex((p, i) => i > this.singlesPageIndex && p.pageTokenFrom === nextToken);
      if (existing !== -1) {
        this.singlesPageIndex = existing;
        return;
      }
      this.loading = true;
      try {
        const res = await badmintonClient.listMatches(this.groupId, { kind: "singles", limit: this.singlesLimit, pageToken: nextToken });
        this.singlesPages.push({ items: res?.items || [], pageToken: res?.pageToken || null, pageTokenFrom: nextToken });
        this.singlesPageIndex = this.singlesPages.length - 1;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errNextPage");
      } finally {
        this.loading = false;
      }
    },
    async changeSinglesLimit(limit) {
      if (this.singlesLimit === limit) {
        this.showSinglesLimitDropdown = false;
        return;
      }
      this.singlesLimit = limit;
      this.showSinglesLimitDropdown = false;
      this.loading = true;
      try {
        const res = await badmintonClient.listMatches(this.groupId, { kind: "singles", limit });
        this.singlesPages = [{ items: res?.items || [], pageToken: res?.pageToken || null }];
        this.singlesPageIndex = 0;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLoad");
      } finally {
        this.loading = false;
      }
    },
    async goPrevDoubles() {
      if (this.doublesPageIndex > 0) this.doublesPageIndex--;
    },
    async goNextDoubles() {
      const current = this.currentDoublesPage;
      const nextToken = current.pageToken;
      if (!nextToken) return;
      const existing = this.doublesPages.findIndex((p, i) => i > this.doublesPageIndex && p.pageTokenFrom === nextToken);
      if (existing !== -1) {
        this.doublesPageIndex = existing;
        return;
      }
      this.loading = true;
      try {
        const res = await badmintonClient.listMatches(this.groupId, { kind: "doubles", limit: this.doublesLimit, pageToken: nextToken });
        this.doublesPages.push({ items: res?.items || [], pageToken: res?.pageToken || null, pageTokenFrom: nextToken });
        this.doublesPageIndex = this.doublesPages.length - 1;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errNextPage");
      } finally {
        this.loading = false;
      }
    },
    async changeDoublesLimit(limit) {
      if (this.doublesLimit === limit) {
        this.showDoublesLimitDropdown = false;
        return;
      }
      this.doublesLimit = limit;
      this.showDoublesLimitDropdown = false;
      this.loading = true;
      try {
        const res = await badmintonClient.listMatches(this.groupId, { kind: "doubles", limit });
        this.doublesPages = [{ items: res?.items || [], pageToken: res?.pageToken || null }];
        this.doublesPageIndex = 0;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLoad");
      } finally {
        this.loading = false;
      }
    },

    async loadLeaderboards() {
      this.loadingLb = true;
      try {
        const [s, d] = await Promise.all([
          badmintonClient.getSinglesLeaderboard(this.groupId, { limit: this.lbLimit }),
          badmintonClient.getDoublesLeaderboard(this.groupId, { limit: this.lbLimit }),
        ]);
        this.singlesLbPages = [{ items: s?.items || [], pageToken: s?.pageToken || null }];
        this.singlesLbPageIndex = 0;
        this.doublesLbPages = [{ items: d?.items || [], pageToken: d?.pageToken || null }];
        this.doublesLbPageIndex = 0;
      } catch (e) {
        // don't block main UI
      } finally {
        this.loadingLb = false;
      }
    },
    async goPrevSinglesLb() {
      if (!this.canGoPrevSinglesLb) return;
      this.singlesLbPageIndex = Math.max(0, this.singlesLbPageIndex - 1);
    },
    async goNextSinglesLb() {
      if (!this.canGoNextSinglesLb) return;
      const current = this.currentSinglesLbPage;
      const nextToken = current.pageToken;
      if (!nextToken) return;
      const existingIndex = this.singlesLbPages.findIndex(
        (p, idx) => idx > this.singlesLbPageIndex && p.pageTokenFrom === nextToken
      );
      if (existingIndex !== -1) {
        this.singlesLbPageIndex = existingIndex;
        return;
      }
      this.loadingLb = true;
      try {
        const res = await badmintonClient.getSinglesLeaderboard(this.groupId, { limit: this.lbLimit, pageToken: nextToken });
        const page = { items: res?.items || [], pageToken: res?.pageToken || null, pageTokenFrom: nextToken };
        this.singlesLbPages.push(page);
        this.singlesLbPageIndex = this.singlesLbPages.length - 1;
      } finally {
        this.loadingLb = false;
      }
    },
    async goPrevDoublesLb() {
      if (!this.canGoPrevDoublesLb) return;
      this.doublesLbPageIndex = Math.max(0, this.doublesLbPageIndex - 1);
    },
    async goNextDoublesLb() {
      if (!this.canGoNextDoublesLb) return;
      const current = this.currentDoublesLbPage;
      const nextToken = current.pageToken;
      if (!nextToken) return;
      const existingIndex = this.doublesLbPages.findIndex(
        (p, idx) => idx > this.doublesLbPageIndex && p.pageTokenFrom === nextToken
      );
      if (existingIndex !== -1) {
        this.doublesLbPageIndex = existingIndex;
        return;
      }
      this.loadingLb = true;
      try {
        const res = await badmintonClient.getDoublesLeaderboard(this.groupId, { limit: this.lbLimit, pageToken: nextToken });
        const page = { items: res?.items || [], pageToken: res?.pageToken || null, pageTokenFrom: nextToken };
        this.doublesLbPages.push(page);
        this.doublesLbPageIndex = this.doublesLbPages.length - 1;
      } finally {
        this.loadingLb = false;
      }
    },
    toggleSinglesLbLimitDropdown() {
      this.showSinglesLbLimitDropdown = !this.showSinglesLbLimitDropdown;
    },
    toggleDoublesLbLimitDropdown() {
      this.showDoublesLbLimitDropdown = !this.showDoublesLbLimitDropdown;
    },
    async changeLbLimit(limit, which) {
      if (this.lbLimit === limit) {
        this.showSinglesLbLimitDropdown = false;
        this.showDoublesLbLimitDropdown = false;
        return;
      }
      this.lbLimit = limit;
      this.showSinglesLbLimitDropdown = false;
      this.showDoublesLbLimitDropdown = false;
      await this.loadLeaderboards();
    },

    formatTeams(m) {
      const map = this.participantNameMap || {};
      const a = (m.teamA || []).map(id => map[id] || id).join(" + ");
      const b = (m.teamB || []).map(id => map[id] || id).join(" + ");
      return `${a} vs ${b}`;
    },
    formatScore(score) {
      const games = score?.games || [];
      return games.map(g => `${g.pointsA}-${g.pointsB}`).join(", ");
    },
    getParticipantName(participantId) {
      if (!participantId) return this.$t("common.misc.noData");
      return this.participantNameMap[participantId] || participantId;
    },
    getFinalScore(match, side) {
      const games = match.score?.games || [];
      if (games.length === 0) return this.$t("common.misc.noData");
      // Return points from the last game
      const lastGame = games[games.length - 1];
      return side === 'A' ? lastGame.pointsA : lastGame.pointsB;
    },
    formatDate(dateStr) {
      if (!dateStr) return this.$t("common.misc.noData");
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(this.$i18n.locale === "ru" ? "ru-RU" : "en-US", { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch {
        return dateStr;
      }
    },

    async addParticipant() {
      this.loadingAddParticipant = true;
      this.error = "";
      try {
        const p = await badmintonClient.createParticipant(this.groupId, {name: this.newParticipantName});
        this.newParticipantName = "";
        this.mergeParticipantNames([p]);
        if (this.participantsPages.length && this.participantsPageIndex === 0) {
          const first = this.participantsPages[0];
          this.participantsPages = [{ ...first, items: [p, ...(first.items || [])] }];
        }
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errAddParticipant");
      } finally {
        this.loadingAddParticipant = false;
      }
    },

    startEditParticipant(p) {
      this.modal = {type: "editParticipant", payload: {participantId: p.id, name: p.name}};
    },
    async saveParticipantEdit() {
      this.modalLoading = true;
      this.error = "";
      try {
        const upd = await badmintonClient.updateParticipant(this.groupId, this.modal.payload.participantId, {name: this.modal.payload.name});
        this.mergeParticipantNames([upd]);
        const idx = this.participantsPageIndex;
        if (this.participantsPages[idx]) {
          const items = this.participantsPages[idx].items.map(p => (p.id === upd.id ? upd : p));
          this.participantsPages = this.participantsPages.slice();
          this.participantsPages[idx] = { ...this.participantsPages[idx], items };
        }
        this.closeModal();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errUpdateParticipant");
      } finally {
        this.modalLoading = false;
      }
    },

    startLinkUser(p) {
      this.modal = {type: "linkUser", payload: {participantId: p.id, userId: ""}};
    },
    async confirmLinkUser() {
      this.modalLoading = true;
      this.error = "";
      try {
        const upd = await badmintonClient.linkUserToParticipant(this.groupId, this.modal.payload.participantId, {userId: this.modal.payload.userId});
        this.mergeParticipantNames([upd]);
        const idx = this.participantsPageIndex;
        if (this.participantsPages[idx]) {
          const items = this.participantsPages[idx].items.map(p => (p.id === upd.id ? upd : p));
          this.participantsPages = this.participantsPages.slice();
          this.participantsPages[idx] = { ...this.participantsPages[idx], items };
        }
        this.closeModal();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLinkUser");
      } finally {
        this.modalLoading = false;
      }
    },

    async removeParticipant(p) {
      if (!confirm(this.$t("badminton.group.confirmDeleteParticipant", { name: p.name }))) return;
      this.error = "";
      try {
        await badmintonClient.deleteParticipant(this.groupId, p.id);
        const { [p.id]: _, ...rest } = this.participantNameMap;
        this.participantNameMap = rest;
        const idx = this.participantsPageIndex;
        if (this.participantsPages[idx]) {
          const items = this.participantsPages[idx].items.filter(x => x.id !== p.id);
          this.participantsPages = this.participantsPages.slice();
          this.participantsPages[idx] = { ...this.participantsPages[idx], items };
        }
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errDeleteParticipant");
      }
    },

    openCreateMatch(kind) {
      // Reset search states
      this.participantSearchState = {
        team1P1: {items: [], page: 0, hasMore: false, loading: false},
        team1P2: {items: [], page: 0, hasMore: false, loading: false},
        team2P1: {items: [], page: 0, hasMore: false, loading: false},
        team2P2: {items: [], page: 0, hasMore: false, loading: false},
      };
      this.modal = {
        type: "match",
        payload: {
          matchId: "",
          kind,
          // Singles
          team1P1: null,
          team1Scores: [21],
          team2P1: null,
          team2Scores: [21],
          // Doubles
          team1P2: null,
          team2P2: null,
          // Search fields
          searchTeam1P1: "",
          searchTeam1P2: "",
          searchTeam2P1: "",
          searchTeam2P2: "",
        },
      };
    },
    openEditMatch(m) {
      // Reset search states
      this.participantSearchState = {
        team1P1: {items: [], page: 0, hasMore: false, loading: false},
        team1P2: {items: [], page: 0, hasMore: false, loading: false},
        team2P1: {items: [], page: 0, hasMore: false, loading: false},
        team2P2: {items: [], page: 0, hasMore: false, loading: false},
      };
      const games = m.score?.games || [];
      const team1Scores = games.map(g => g.pointsA);
      const team2Scores = games.map(g => g.pointsB);
      
      if (m.kind === "singles") {
        this.modal = {
          type: "match",
          payload: {
            matchId: m.id,
            kind: m.kind,
            team1P1: m.teamA?.[0] || null,
            team1Scores: team1Scores.length > 0 ? team1Scores : [null],
            team2P1: m.teamB?.[0] || null,
            team2Scores: team2Scores.length > 0 ? team2Scores : [null],
            searchTeam1P1: "",
            searchTeam2P1: "",
          },
        };
      } else {
        this.modal = {
          type: "match",
          payload: {
            matchId: m.id,
            kind: m.kind,
            team1P1: m.teamA?.[0] || null,
            team1P2: m.teamA?.[1] || null,
            team1Scores: team1Scores.length > 0 ? team1Scores : [null],
            team2P1: m.teamB?.[0] || null,
            team2P2: m.teamB?.[1] || null,
            team2Scores: team2Scores.length > 0 ? team2Scores : [null],
            searchTeam1P1: "",
            searchTeam1P2: "",
            searchTeam2P1: "",
            searchTeam2P2: "",
          },
        };
      }
    },
    getParticipantsList(field) {
      return this.participantSearchState[field] || {items: [], page: 0, hasMore: false, loading: false};
    },
    async loadParticipantsPage(field, page, append = false) {
      if (!this.groupId) return;
      const state = this.participantSearchState[field];
      if (!state) return;
      
      // Don't load if already loading or no more pages
      if (state.loading || (!append && page === 0 && state.items.length > 0)) return;
      if (append && !state.hasMore) return;
      
      state.loading = true;
      const searchField = `search${field.charAt(0).toUpperCase() + field.slice(1)}`;
      const query = this.modal.payload[searchField] || "";
      
      try {
        const result = await badmintonClient.searchParticipants(this.groupId, {
          query: query.trim(),
          page,
          pageSize: 10,
        });
        
        // Filter out already selected participants
        const filtered = result.items.filter(p => !this.isParticipantSelected(p.id, field));
        
        if (append) {
          // Append new items, avoiding duplicates
          const existingIds = new Set(state.items.map(p => p.id));
          const newItems = filtered.filter(p => !existingIds.has(p.id));
          state.items = [...state.items, ...newItems];
        } else {
          // Replace items
          state.items = filtered;
        }
        state.page = page;
        state.hasMore = result.hasMore;
      } catch (e) {
        console.error("Failed to load participants:", e);
        if (!append) {
          state.items = [];
        }
        state.hasMore = false;
      } finally {
        state.loading = false;
      }
    },
    handleScroll(field, event) {
      const target = event.target;
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      
      // Load next page when scrolled near bottom (within 50px)
      if (scrollBottom < 50) {
        const state = this.participantSearchState[field];
        if (state && state.hasMore && !state.loading) {
          this.loadParticipantsPage(field, state.page + 1, true);
        }
      }
    },
    async searchParticipantsField(field) {
      // Reset state and load page 0
      const state = this.participantSearchState[field];
      if (state) {
        state.items = [];
        state.page = 0;
        state.hasMore = false;
      }
      await this.loadParticipantsPage(field, 0, false);
    },
    isParticipantSelected(participantId, excludeField) {
      const payload = this.modal.payload;
      if (excludeField !== "team1P1" && payload.team1P1 === participantId) return true;
      if (excludeField !== "team1P2" && payload.team1P2 === participantId) return true;
      if (excludeField !== "team2P1" && payload.team2P1 === participantId) return true;
      if (excludeField !== "team2P2" && payload.team2P2 === participantId) return true;
      return false;
    },
    selectParticipant(field, participant) {
      this.modal.payload[field] = participant.id;
      const searchField = `search${field.charAt(0).toUpperCase() + field.slice(1)}`;
      this.modal.payload[searchField] = "";
      // Reset search state
      if (this.participantSearchState[field]) {
        this.participantSearchState[field] = {items: [], page: 0, hasMore: false, loading: false};
      }
    },
    addScore(team) {
      const field = `${team}Scores`;
      const otherTeam = team === "team1" ? "team2" : "team1";
      const otherField = `${otherTeam}Scores`;
      
      if (!this.modal.payload[field]) {
        this.modal.payload[field] = [21];
      }
      if (!this.modal.payload[otherField]) {
        this.modal.payload[otherField] = [21];
      }
      
      // Add score to both teams simultaneously (default 21)
      this.modal.payload[field].push(21);
      this.modal.payload[otherField].push(21);
    },
    removeScore(team, idx) {
      const field = `${team}Scores`;
      const otherTeam = team === "team1" ? "team2" : "team1";
      const otherField = `${otherTeam}Scores`;
      
      // Remove score from both teams simultaneously
      if (this.modal.payload[field] && this.modal.payload[field].length > idx) {
        this.modal.payload[field].splice(idx, 1);
      }
      if (this.modal.payload[otherField] && this.modal.payload[otherField].length > idx) {
        this.modal.payload[otherField].splice(idx, 1);
      }
      
      // Ensure at least one score field exists
      if (this.modal.payload[field].length === 0) {
        this.modal.payload[field] = [21];
      }
      if (this.modal.payload[otherField].length === 0) {
        this.modal.payload[otherField] = [21];
      }
    },
    async saveMatch() {
      this.modalLoading = true;
      this.error = "";
      try {
        const payload = {kind: this.modal.payload.kind};
        
        // Build teams
        if (this.modal.payload.kind === "singles") {
          payload.teamA = this.modal.payload.team1P1 ? [this.modal.payload.team1P1] : [];
          payload.teamB = this.modal.payload.team2P1 ? [this.modal.payload.team2P1] : [];
        } else {
          payload.teamA = [
            this.modal.payload.team1P1,
            this.modal.payload.team1P2,
          ].filter(Boolean);
          payload.teamB = [
            this.modal.payload.team2P1,
            this.modal.payload.team2P2,
          ].filter(Boolean);
        }
        
        // Build games from scores
        const team1Scores = (this.modal.payload.team1Scores || []).filter(s => s !== null && s !== undefined);
        const team2Scores = (this.modal.payload.team2Scores || []).filter(s => s !== null && s !== undefined);
        const maxGames = Math.max(team1Scores.length, team2Scores.length);
        const games = [];
        for (let i = 0; i < maxGames; i++) {
          const score1 = team1Scores[i] || 0;
          const score2 = team2Scores[i] || 0;
          if (score1 > 0 || score2 > 0) {
            games.push({pointsA: score1, pointsB: score2});
          }
        }
        payload.score = {games};

        let m;
        const kind = payload.kind;
        if (this.modal.payload.matchId) {
          m = await badmintonClient.updateMatch(this.groupId, this.modal.payload.matchId, payload);
          if (kind === "singles" && this.singlesPages.length && this.singlesPageIndex === 0) {
            const first = this.singlesPages[0];
            this.singlesPages = [{ ...first, items: (first.items || []).map(x => (x.id === m.id ? m : x)) }];
          } else if (kind === "doubles" && this.doublesPages.length && this.doublesPageIndex === 0) {
            const first = this.doublesPages[0];
            this.doublesPages = [{ ...first, items: (first.items || []).map(x => (x.id === m.id ? m : x)) }];
          }
        } else {
          m = await badmintonClient.createMatch(this.groupId, payload);
          if (kind === "singles" && this.singlesPages.length && this.singlesPageIndex === 0) {
            const first = this.singlesPages[0];
            this.singlesPages = [{ ...first, items: [m, ...(first.items || [])] }];
          } else if (kind === "doubles" && this.doublesPages.length && this.doublesPageIndex === 0) {
            const first = this.doublesPages[0];
            this.doublesPages = [{ ...first, items: [m, ...(first.items || [])] }];
          }
        }
        this.closeModal();
        if (this.groupSection === "leaderboards") this.loadLeaderboards();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errSaveMatch");
      } finally {
        this.modalLoading = false;
      }
    },
    async removeMatch(m) {
      if (!confirm(this.$t("badminton.group.confirmDeleteMatch", { id: m.id }))) return;
      this.error = "";
      try {
        await badmintonClient.deleteMatch(this.groupId, m.id);
        if (m.kind === "singles" && this.singlesPages[this.singlesPageIndex]) {
          const items = this.singlesPages[this.singlesPageIndex].items.filter(x => x.id !== m.id);
          this.singlesPages = this.singlesPages.slice();
          this.singlesPages[this.singlesPageIndex] = { ...this.singlesPages[this.singlesPageIndex], items };
        } else if (m.kind === "doubles" && this.doublesPages[this.doublesPageIndex]) {
          const items = this.doublesPages[this.doublesPageIndex].items.filter(x => x.id !== m.id);
          this.doublesPages = this.doublesPages.slice();
          this.doublesPages[this.doublesPageIndex] = { ...this.doublesPages[this.doublesPageIndex], items };
        }
        if (this.groupSection === "leaderboards") this.loadLeaderboards();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errDeleteMatch");
      }
    },

    closeModal() {
      this.modal = {type: "", payload: {}};
      this.modalLoading = false;
    },
  },
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 64px; max-width: 100%; box-sizing: border-box; }
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.crumbs { font-family: var(--font-display); display: flex; gap: 8px; align-items: center; }
.crumb { text-decoration: none; color: #4F3DFF; font-weight: 700; }
.crumb.current { color: black; font-weight: 700; }
.sep { opacity: 0.6; }
.title { margin: 4px 0 0 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }
.topActions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.pill { background: white; border: 1px solid rgba(79,61,255,0.35); color: #4F3DFF; padding: 6px 12px; border-radius: 999px; font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.pill.tiny { padding: 3px 8px; font-size: 12px; }

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }

.groupNav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.groupNavLink {
  padding: 10px 18px;
  border-radius: 100px;
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: #4F3DFF;
  border: 2px solid #e0e0ff;
  background: white;
  transition: background 0.2s, border-color 0.2s;
}
.groupNavLink:hover { background: #fafaff; border-color: #4F3DFF; }
.groupNavLink.active { background: #4F3DFF; color: white; border-color: #4F3DFF; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; min-width: 0; max-width: 100%; }
.card { background: white; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; max-width: 100%; min-width: 0; box-sizing: border-box; }
.cardTitle { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #4F3DFF; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; width: 100%; min-width: 0; box-sizing: border-box; }
.input { padding: 12px 14px; border-radius: 12px; border: 1px solid #ddd; font-family: var(--font-display); font-size: 16px; flex: 1 1 0; min-width: 0; max-width: 100%; width: 0; box-sizing: border-box; }
.label { font-family: var(--font-display); font-weight: 700; width: 90px; }
.btn { flex: 0 0 auto; border: none; cursor: pointer; background-color: #4F3DFF; color: white; border-radius: 100px; padding: 10px 14px; font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.btn.secondary { background: white; color: #4F3DFF; border: 2px solid #4F3DFF; }
.btn.danger { background: #ff3d3d; color: white; }
.btn.small { padding: 8px 10px; font-size: 13px; }
.btn:disabled { opacity: 0.7; cursor: default; }

.empty { font-family: var(--font-display); opacity: 0.7; padding: 20px; text-align: center; }

.tableWrapper { overflow-x: auto; max-width: 100%; min-width: 0; }
.table { width: 100%; border-collapse: collapse; font-family: var(--font-display); }
.table thead { background: #f6f6ff; }
.table th { padding: 14px 12px; text-align: left; font-weight: 700; font-size: 15px; color: #4F3DFF; border-bottom: 2px solid #e0e0ff; white-space: nowrap; }
.table td { padding: 12px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.table tbody tr:hover { background: #fafaff; }
.table tbody tr:last-child td { border-bottom: none; }
.nameCell { font-weight: 600; }
.userIdCell { font-size: 13px; opacity: 0.7; font-family: monospace; }
.scoreCell { font-weight: 700; color: #4F3DFF; text-align: center; }
.scoreCell.score21 { background-color: #ffeb3b; color: #333; border-radius: 4px; }
.dateCell { font-size: 13px; opacity: 0.8; white-space: nowrap; }
.actionsCell { display: flex; gap: 8px; flex-wrap: wrap; }

.matchSection { margin-top: 20px; }
.matchSection:first-child { margin-top: 0; }
.matchSectionTitle { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: #4F3DFF; margin-bottom: 12px; }

.lbGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; min-width: 0; max-width: 100%; }
.lbCard { background: white; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; min-width: 0; box-sizing: border-box; }
.lbTitle { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: #4F3DFF; }
.eloCell { font-weight: 700; color: #4F3DFF; font-size: 16px; }
.rankCell { font-weight: 700; opacity: 0.85; font-size: 14px; }

.pagerRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
  max-width: 100%;
  min-width: 0;
}
.pagerButton {
  border: 2px solid #4F3DFF;
  background-color: white;
  border-radius: 999px;
  padding: 6px 14px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: #4F3DFF;
  cursor: pointer;
}
.pagerButton:disabled {
  opacity: 0.5;
  cursor: default;
}
.pagerPage {
  font-family: var(--font-display);
  font-size: 16px;
}
.pagerLimit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
  min-width: 0;
}
.pagerLimitLabel {
  font-family: var(--font-display);
  font-size: 14px;
}
.pagerLimitSelect {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 100px;
  border: 2px solid #4F3DFF;
  background-color: white;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: #4F3DFF;
  cursor: pointer;
}
.pagerLimitArrow { font-size: 10px; }
.pagerLimitDropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  z-index: 10;
}
.pagerLimitOption {
  padding: 8px 12px;
  font-family: var(--font-display);
  font-size: 14px;
  cursor: pointer;
}
.pagerLimitOption:hover { background-color: #f6f6ff; }
.pagerLimitOption.active { font-weight: 700; color: #4F3DFF; }

.modalOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; padding: 18px; z-index: 1000; }
.modal { width: min(600px, 100%); max-width: 100%; box-sizing: border-box; background: white; border-radius: 18px; padding: 20px; max-height: 90vh; overflow-y: auto; }
.modalTitle { font-family: var(--font-display); font-weight: 700; font-size: 20px; margin-bottom: 16px; color: #4F3DFF; }
.modalBody { display: flex; flex-direction: column; gap: 16px; }

.matchForm { display: flex; flex-direction: column; gap: 24px; }
.formSection { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #fafaff; border-radius: 12px; }
.sectionTitle { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: #4F3DFF; margin-bottom: 8px; }

.participantSearch { position: relative; }
.dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 8px; margin-top: 4px; max-height: 300px; overflow-y: auto; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.dropdownItem { padding: 10px 14px; cursor: pointer; font-family: var(--font-display); font-size: 14px; }
.dropdownItem:hover { background: #f6f6ff; }

.selectedParticipant { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: white; border: 2px solid #4F3DFF; border-radius: 8px; font-family: var(--font-display); font-weight: 600; }


.scoresRow { display: flex; align-items: center; gap: 12px; }
.scoresLabel { font-family: var(--font-display); font-weight: 700; font-size: 14px; min-width: 60px; }
.scoresInputs { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.scoreInput { width: 60px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-family: var(--font-display); font-size: 14px; text-align: center; }

@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; }
  .lbGrid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 0 20px 20px 20px; }
  .title { font-size: 28px; }
}

@media (prefers-color-scheme: dark) {
  .crumb.current,
  .title {
    color: #e8e8e8;
  }

  .pill {
    background: #2d2d2d;
    border-color: #6f62c6;
    color: #c7bcff;
  }

  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }

  .groupNavLink,
  .card,
  .lbCard,
  .modal {
    background: #2d2d2d;
    border-color: #4a4a4a;
  }

  .groupNavLink:hover {
    background: #363636;
  }

  .input,
  .scoreInput {
    background: #242424;
    border-color: #4a4a4a;
    color: #e8e8e8;
  }

  .table thead {
    background: #343434;
  }

  .table th {
    border-bottom-color: #4a4a4a;
  }

  .table td {
    border-bottom-color: #3b3b3b;
    color: #e8e8e8;
  }

  .table tbody tr:hover {
    background: #363636;
  }

  .btn.secondary,
  .pagerButton,
  .pagerLimitSelect {
    background-color: #2d2d2d;
  }

  .selectedParticipant,
  .formSection,
  .dropdown,
  .pagerLimitDropdown {
    background: #2d2d2d;
    border-color: #4a4a4a;
  }

  .dropdownItem:hover,
  .pagerLimitOption:hover {
    background-color: #3a3a3a;
  }
}
</style>


