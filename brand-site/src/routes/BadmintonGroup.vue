<template>
  <div class="page">
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
          <BadmintonNotificationBell />
          <LocaleSwitcher />
          <span v-if="group?.isOwner" class="rolePill role-owner">{{ formatRole('owner') }}</span>
          <span v-else-if="group?.myRole" class="rolePill" :class="'role-' + group.myRole">{{ formatRole(group.myRole) }}</span>
          <button class="btn secondary" :disabled="loading" @click="refresh">
            <LoadingPhrase v-if="loading" :text="$t('common.actions.loading')" />
            <template v-else>{{ $t('common.actions.refresh') }}</template>
          </button>
        </div>
      </div>

      <div v-if="error" class="errorBox">{{ error }}</div>
      <div v-if="inviteNotice" class="noticeBox">{{ inviteNotice }}</div>

      <nav class="groupNav">
        <RouterLink
          class="groupNavLink"
          :class="{ active: isMatchesNavActive }"
          :to="matchesListTo()"
        >
          {{ $t('badminton.group.matches') }}
        </RouterLink>
        <RouterLink
          class="groupNavLink"
          :class="{ active: isParticipantsNavActive }"
          :to="participantsListTo()"
        >
          {{ $t('badminton.group.participants') }}
        </RouterLink>
        <RouterLink
          class="groupNavLink"
          :class="{ active: isLeaderboardsNavActive }"
          :to="leaderboardsSubNavTo()"
        >
          {{ $t('badminton.group.leaderboards') }}
        </RouterLink>
      </nav>

      <BadmintonPillNav
        v-if="groupSection === 'matches'"
        :items="groupMatchesNavItems"
        aria-label="group matches kind"
      />
      <BadmintonPillNav
        v-if="groupSection === 'leaderboards'"
        :items="groupLeaderboardsNavItems"
        aria-label="group leaderboards kind"
      />

      <div v-if="groupSection === 'participants'" class="grid">
        <div class="card">
          <div class="cardTitle">{{ $t('badminton.group.participants') }}</div>

          <div v-if="isStaff" class="addParticipantBlock">
            <div v-if="participants.length === 0" class="hint">{{ $t('badminton.group.createUnlinkedHint') }}</div>

            <div class="addParticipantSection">
              <div class="addParticipantLabel">{{ $t('badminton.group.inviteExisting') }}</div>
              <div class="hint">{{ $t('badminton.group.inviteExistingHint') }}</div>
              <div class="row inviteSearchRow">
                <div class="participantSearch inviteSearch">
                  <input
                    class="input"
                    v-model="newParticipantName"
                    :placeholder="$t('badminton.group.participantUsername')"
                    autocomplete="off"
                    @input="onInviteUserSearchInput"
                    @focus="onInviteUserSearchFocus"
                  />
                  <div
                    v-if="showInviteUserDropdown"
                    class="dropdown"
                    @scroll="onInviteUserDropdownScroll"
                  >
                    <div v-if="inviteUserSearch.loading && inviteUserSearch.items.length === 0" class="dropdownItem">
                      <LoadingPhrase :text="$t('common.actions.loading')" />
                    </div>
                    <div
                      v-for="u in inviteUserSearch.items"
                      :key="u.id"
                      class="dropdownItem"
                      @click="selectInviteUser(u)"
                    >
                      <PersonChip
                        :name="inviteUserLabel(u)"
                        :photo-url="u.photoUrl"
                        :photo-crop="u.photoCrop || null"
                        :username="u.username"
                      />
                    </div>
                    <div v-if="inviteUserSearch.loading && inviteUserSearch.items.length > 0" class="dropdownItem">
                      <LoadingPhrase :text="$t('badminton.group.loadingMore')" />
                    </div>
                    <div
                      v-if="!inviteUserSearch.loading && inviteUserSearch.items.length === 0 && newParticipantName.trim()"
                      class="dropdownItem muted"
                    >
                      {{ $t('badminton.group.noUsersFound') }}
                    </div>
                  </div>
                </div>
                <button class="btn" :disabled="loadingAddParticipant || !newParticipantName" @click="addParticipant">
                  <LoadingPhrase v-if="loadingAddParticipant" :text="$t('badminton.group.inviting')" />
                  <template v-else>{{ $t('common.actions.invite') }}</template>
                </button>
              </div>
            </div>

            <div class="addParticipantSection" @paste="onUnlinkedPhotoPaste">
              <div class="addParticipantLabel">{{ $t('badminton.group.createUnlinked') }}</div>
              <div class="row">
                <input
                  class="input"
                  v-model="newUnlinkedFirstName"
                  :placeholder="$t('badminton.group.firstName')"
                  @input="onUnlinkedFirstNameInput"
                  @blur="onUnlinkedFirstNameBlur"
                />
                <input
                  class="input"
                  v-model="newUnlinkedLastName"
                  :placeholder="$t('badminton.group.lastName')"
                  @input="onUnlinkedLastNameInput"
                  @blur="onUnlinkedLastNameBlur"
                />
                <input
                  class="input"
                  v-model="newUnlinkedUsername"
                  :placeholder="$t('badminton.group.login')"
                  @input="newUnlinkedUsernameTouched = true"
                />
                <button
                  class="btn"
                  :disabled="loadingAddUnlinked || !canCreateUnlinked"
                  @click="addUnlinkedParticipant"
                >
                  <LoadingPhrase v-if="loadingAddUnlinked" :text="$t('badminton.group.adding')" />
                  <template v-else>{{ $t('common.actions.add') }}</template>
                </button>
              </div>
              <div class="photoPickerRow" :title="$t('badminton.group.pastePhotoHint')">
                <div class="photoPreview" :class="{ empty: !isPreviewablePhotoUrl(newUnlinkedPhotoUrl) }">
                  <PhotoHoldPreview
                    v-if="isPreviewablePhotoUrl(newUnlinkedPhotoUrl)"
                    :src="newUnlinkedPhotoUrl"
                    alt=""
                  />
                  <span v-else>{{ $t('badminton.group.photo') }}</span>
                </div>
                <label class="btn secondary small photoFileLabel">
                  <LoadingPhrase v-if="uploadingUnlinkedPhoto" :text="$t('badminton.group.uploadingPhoto')" />
                  <template v-else>{{ $t('badminton.group.choosePhoto') }}</template>
                  <input
                    class="photoFileInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="uploadingUnlinkedPhoto || loadingAddUnlinked"
                    @change="onUnlinkedPhotoFileChange"
                  />
                </label>
                <input
                  class="input"
                  v-model="newUnlinkedPhotoUrl"
                  :placeholder="$t('badminton.group.photoUrlPlaceholder')"
                />
                <button
                  v-if="newUnlinkedPhotoUrl"
                  type="button"
                  class="btn secondary small"
                  @click="clearUnlinkedPhoto"
                >
                  {{ $t('badminton.group.clearPhoto') }}
                </button>
              </div>
            </div>
          </div>

          <div class="row participantsFilterRow">
            <input
              class="input"
              v-model="participantsQuery"
              :placeholder="$t('badminton.group.searchParticipants')"
              autocomplete="off"
              @input="onParticipantsQueryInput"
            />
          </div>

          <div v-if="participants.length === 0" class="empty">
            {{ participantsQuery.trim()
              ? $t('badminton.group.noParticipantsFound')
              : $t('badminton.group.noParticipants') }}
          </div>
          <div v-else>
            <div class="tableWrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>{{ $t('badminton.group.name') }}</th>
                    <th>{{ $t('badminton.group.role') }}</th>
                    <th v-if="isStaff">{{ $t('badminton.group.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in participants" :key="p.id">
                    <td class="nameCell">
                      <PersonChip
                        :name="p.name"
                        :photo-url="p.photoUrl || getParticipantPhoto(p.id)"
                        :photo-crop="p.photoCrop || getParticipantCrop(p.id)"
                        :username="p.username || getParticipantUsername(p.id)"
                      />
                    </td>
                    <td class="roleCell">
                      <label
                        v-if="canAssignRole(p)"
                        class="roleSelectWrap"
                        :class="'role-' + (p.role || 'member')"
                      >
                        <select
                          class="roleSelect"
                          :value="p.role || 'member'"
                          :disabled="formSaving"
                          :aria-label="$t('badminton.group.role')"
                          @change="onParticipantRoleChange(p, $event.target.value)"
                        >
                          <option v-for="role in assignableRoles" :key="role" :value="role">
                            {{ formatRole(role) }}
                          </option>
                        </select>
                        <span class="roleSelectChevron" aria-hidden="true">▾</span>
                      </label>
                      <span
                        v-else
                        class="rolePill"
                        :class="'role-' + participantRoleKey(p)"
                      >{{ formatRole(participantRoleKey(p)) }}</span>
                    </td>
                    <td v-if="isStaff" class="actionsCell">
                      <RouterLink
                        v-if="isUnlinkedParticipant(p)"
                        class="btn secondary small"
                        :to="editParticipantTo(p.id)"
                      >{{ $t('common.actions.edit') }}</RouterLink>
                      <RouterLink
                        v-if="isUnlinkedParticipant(p)"
                        class="btn secondary small"
                        :to="linkUserTo(p.id)"
                      >{{ $t('common.actions.link') }}</RouterLink>
                      <button
                        v-if="group?.isOwner && !isUnlinkedParticipant(p) && p.id !== meId"
                        class="btn secondary small"
                        :disabled="formSaving"
                        @click="transferOwnership(p)"
                      >{{ $t('badminton.group.makeOwner') }}</button>
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
        <div class="cardTitleRow">
          <div class="cardTitle">{{ $t('badminton.group.matches') }}</div>
          <RouterLink
            v-if="isMatchEditor"
            class="btn iconPlus"
            :to="createMatchTo(effectiveMatchTab)"
            :aria-label="createMatchLabel"
            :title="createMatchLabel"
          >+</RouterLink>
        </div>
        <div v-if="loading && noMatchesForCurrentTab" class="empty">
          <LoadingPhrase :text="$t('common.actions.loading')" />
        </div>
        <div v-else-if="noMatchesForCurrentTab" class="empty">{{ $t('badminton.group.noMatches') }}</div>
        <div v-if="singlesMatches.length > 0 && effectiveMatchTab === 'singles'" class="matchSection">
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
                  <th v-if="isMatchEditor">{{ $t('badminton.group.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in singlesMatches" :key="m.id">
                  <td class="nameCell">
                    <PersonChip
                      :name="getParticipantName(m.teamA?.[0])"
                      :photo-url="getParticipantPhoto(m.teamA?.[0])"
                      :photo-crop="getParticipantCrop(m.teamA?.[0])"
                      :username="getParticipantUsername(m.teamA?.[0])"
                    />
                  </td>
                  <td class="scoreCell" :class="{score21: getFinalScore(m, 'A') === 21}">{{ getFinalScore(m, 'A') }}</td>
                  <td class="nameCell">
                    <PersonChip
                      :name="getParticipantName(m.teamB?.[0])"
                      :photo-url="getParticipantPhoto(m.teamB?.[0])"
                      :photo-crop="getParticipantCrop(m.teamB?.[0])"
                      :username="getParticipantUsername(m.teamB?.[0])"
                    />
                  </td>
                  <td class="scoreCell" :class="{score21: getFinalScore(m, 'B') === 21}">{{ getFinalScore(m, 'B') }}</td>
                  <td class="dateCell">{{ formatDate(m.createdAt) }}</td>
                  <td v-if="isMatchEditor" class="actionsCell">
                    <RouterLink class="btn secondary small" :to="editMatchTo(m)">{{ $t('common.actions.edit') }}</RouterLink>
                    <button v-if="isStaff" class="btn danger small" @click="removeMatch(m)">{{ $t('common.actions.delete') }}</button>
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
        <div v-if="doublesMatches.length > 0 && effectiveMatchTab === 'doubles'" class="matchSection">
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
                  <th v-if="isMatchEditor">{{ $t('badminton.group.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in doublesMatches" :key="m.id">
                  <td class="nameCell">
                    <PersonChip
                      :name="getParticipantName(m.teamA?.[0])"
                      :photo-url="getParticipantPhoto(m.teamA?.[0])"
                      :photo-crop="getParticipantCrop(m.teamA?.[0])"
                      :username="getParticipantUsername(m.teamA?.[0])"
                    />
                  </td>
                  <td class="nameCell">
                    <PersonChip
                      :name="getParticipantName(m.teamA?.[1])"
                      :photo-url="getParticipantPhoto(m.teamA?.[1])"
                      :photo-crop="getParticipantCrop(m.teamA?.[1])"
                      :username="getParticipantUsername(m.teamA?.[1])"
                    />
                  </td>
                  <td class="scoreCell" :class="{score21: getFinalScore(m, 'A') === 21}">{{ getFinalScore(m, 'A') }}</td>
                  <td class="nameCell">
                    <PersonChip
                      :name="getParticipantName(m.teamB?.[0])"
                      :photo-url="getParticipantPhoto(m.teamB?.[0])"
                      :photo-crop="getParticipantCrop(m.teamB?.[0])"
                      :username="getParticipantUsername(m.teamB?.[0])"
                    />
                  </td>
                  <td class="nameCell">
                    <PersonChip
                      :name="getParticipantName(m.teamB?.[1])"
                      :photo-url="getParticipantPhoto(m.teamB?.[1])"
                      :photo-crop="getParticipantCrop(m.teamB?.[1])"
                      :username="getParticipantUsername(m.teamB?.[1])"
                    />
                  </td>
                  <td class="scoreCell" :class="{score21: getFinalScore(m, 'B') === 21}">{{ getFinalScore(m, 'B') }}</td>
                  <td class="dateCell">{{ formatDate(m.createdAt) }}</td>
                  <td v-if="isMatchEditor" class="actionsCell">
                    <RouterLink class="btn secondary small" :to="editMatchTo(m)">{{ $t('common.actions.edit') }}</RouterLink>
                    <button v-if="isStaff" class="btn danger small" @click="removeMatch(m)">{{ $t('common.actions.delete') }}</button>
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
        <div class="cardTitleRow">
          <div class="cardTitle">{{ leaderboardCardTitle }}</div>
          <button class="btn secondary" :disabled="loadingLb" @click="loadLeaderboards">
            <LoadingPhrase v-if="loadingLb" :text="$t('common.actions.loading')" />
            <template v-else>{{ $t('badminton.group.refreshLeaderboards') }}</template>
          </button>
        </div>

        <div v-if="effectiveMatchTab === 'singles'">
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
                    <td class="nameCell">
                      <PersonChip
                        :name="r.participantName"
                        :photo-url="getParticipantPhoto(r.participantId)"
                        :photo-crop="getParticipantCrop(r.participantId)"
                        :username="getParticipantUsername(r.participantId)"
                      />
                    </td>
                    <td class="eloCell">{{ formatElo(r.elo) }}</td>
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

        <div v-else>
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
                    <td class="nameCell">
                      <span class="personChipRow">
                        <PersonChip
                          v-for="(name, idx) in (r.participantNames || [])"
                          :key="`${r.pairKey}-${idx}`"
                          :name="name"
                          :photo-url="getParticipantPhoto(pairParticipantIds(r.pairKey)[idx])"
                          :photo-crop="getParticipantCrop(pairParticipantIds(r.pairKey)[idx])"
                          :username="getParticipantUsername(pairParticipantIds(r.pairKey)[idx])"
                        />
                      </span>
                    </td>
                    <td class="eloCell">{{ formatElo(r.elo) }}</td>
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

      <!-- Full-page forms (no modals) -->
      <div v-if="groupSection === 'editParticipant'" class="card formPage" @paste="onEditPhotoPaste">
        <div class="cardTitle">{{ $t('badminton.group.editParticipant') }}</div>
        <ProfileEditForm
          v-model:first-name="editParticipantForm.firstName"
          v-model:last-name="editParticipantForm.lastName"
          v-model:photo-url="editParticipantForm.photoUrl"
          v-model:photo-crop="editParticipantForm.photoCrop"
          :photo-cleared="editParticipantForm.photoCleared"
          :first-name-placeholder="$t('badminton.group.firstName')"
          :last-name-placeholder="$t('badminton.group.lastName')"
          :photo-url-placeholder="$t('badminton.group.photoUrlPlaceholder')"
          :photo-label="$t('badminton.group.photo')"
          :clear-photo-label="$t('badminton.group.clearPhoto')"
          :reset-crop-label="$t('badminton.group.resetCrop')"
          :square-crop-label="$t('badminton.group.cropSquare')"
          :crop-hint="$t('badminton.group.cropHint')"
          :paste-photo-hint="$t('badminton.group.pastePhotoHint')"
          @clear-photo="clearEditParticipantPhoto"
          @photo-url-input="onEditPhotoUrlInput"
          @update:photo-crop="onEditPhotoCrop"
        >
          <template #photo-actions>
            <label class="btn secondary small photoFileLabel">
              <LoadingPhrase v-if="uploadingEditPhoto" :text="$t('badminton.group.uploadingPhoto')" />
              <template v-else>{{ $t('badminton.group.choosePhoto') }}</template>
              <input
                class="photoFileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                :disabled="uploadingEditPhoto || formSaving"
                @change="onEditPhotoFileChange"
              />
            </label>
          </template>
          <template #actions>
            <button class="btn" :disabled="formSaving" @click="saveParticipantEdit">{{ $t('common.actions.save') }}</button>
            <button class="btn secondary" :disabled="formSaving" @click="cancelToParticipants">{{ $t('common.actions.cancel') }}</button>
          </template>
        </ProfileEditForm>
      </div>

      <div v-else-if="groupSection === 'linkUser'" class="card formPage">
        <div class="cardTitle">{{ $t('badminton.group.linkUser') }}</div>
        <div class="formStack">
          <div class="hint">{{ $t('badminton.group.linkUserHint') }}</div>
          <div v-if="linkUserForm.selected" class="selectedParticipant">
            <PersonChip
              :name="inviteUserLabel(linkUserForm.selected)"
              :photo-url="linkUserForm.selected.photoUrl"
              :photo-crop="linkUserForm.selected.photoCrop || null"
              :username="linkUserForm.selected.username"
            />
            <button class="btn small danger" type="button" :disabled="formSaving" @click="clearLinkUserSelection">×</button>
          </div>
          <div v-else class="participantSearch inviteSearch formFullWidthInput">
            <input
              class="input"
              v-model="linkUserForm.query"
              :placeholder="$t('badminton.group.linkUserSearchPlaceholder')"
              autocomplete="off"
              @input="onLinkUserSearchInput"
              @focus="onLinkUserSearchFocus"
            />
            <div
              v-if="showLinkUserDropdown"
              class="dropdown"
              @scroll="onLinkUserDropdownScroll"
            >
              <div v-if="linkUserSearch.loading && linkUserSearch.items.length === 0" class="dropdownItem">
                <LoadingPhrase :text="$t('common.actions.loading')" />
              </div>
              <div
                v-for="u in linkUserSearch.items"
                :key="u.id"
                class="dropdownItem"
                @click="selectLinkUser(u)"
              >
                <PersonChip
                  :name="inviteUserLabel(u)"
                  :photo-url="u.photoUrl"
                  :photo-crop="u.photoCrop || null"
                  :username="u.username"
                />
              </div>
              <div v-if="linkUserSearch.loading && linkUserSearch.items.length > 0" class="dropdownItem">
                <LoadingPhrase :text="$t('badminton.group.loadingMore')" />
              </div>
              <div
                v-if="!linkUserSearch.loading && linkUserSearch.items.length === 0 && linkUserForm.query.trim()"
                class="dropdownItem muted"
              >
                {{ $t('badminton.group.noUsersFound') }}
              </div>
            </div>
          </div>
          <div class="row formActions">
            <button class="btn" :disabled="formSaving || !linkUserForm.userId" @click="confirmLinkUser">{{ $t('common.actions.link') }}</button>
            <button class="btn secondary" :disabled="formSaving" @click="cancelToParticipants">{{ $t('common.actions.cancel') }}</button>
          </div>
        </div>
      </div>

      <div v-else-if="groupSection === 'createMatch' || groupSection === 'editMatch'" class="card formPage">
        <div class="cardTitle">{{ matchFormTitle }}</div>
        <div class="formStack">
          <!-- Singles match form -->
          <div v-if="matchForm.kind === 'singles'" class="matchForm">
            <div class="formSection">
              <div class="sectionTitle">{{ $t('badminton.group.team1') }}</div>
              <ParticipantSearchSelect
                v-if="!matchForm.team1P1"
                :group-id="groupId"
                :exclude-ids="matchSelectedParticipantIds"
                :placeholder="$t('common.placeholders.searchParticipant')"
                @select="selectParticipant('team1P1', $event)"
              />
              <div v-if="matchForm.team1P1" class="selectedParticipant">
                <PersonChip
                  :name="getParticipantName(matchForm.team1P1)"
                  :photo-url="getParticipantPhoto(matchForm.team1P1)"
                  :photo-crop="getParticipantCrop(matchForm.team1P1)"
                  :username="getParticipantUsername(matchForm.team1P1)"
                />
                <button class="btn small danger" @click="matchForm.team1P1 = null">×</button>
              </div>

              <div class="scoresRow">
                <div class="scoresLabel">{{ $t('badminton.group.scores') }}:</div>
                <div class="scoresInputs">
                  <div v-for="(score, idx) in matchForm.team1Scores" :key="'t1-' + idx" class="scoreInputWrapper">
                    <input
                      type="number"
                      class="scoreInput"
                      v-model.number="matchForm.team1Scores[idx]"
                      :placeholder="$t('badminton.group.scorePlaceholder')"
                      min="0"
                      max="30"
                    />
                    <button
                      v-if="matchForm.team1Scores.length > 1"
                      class="btn small danger scoreRemoveBtn"
                      @click="removeScore('team1', idx)"
                      :title="$t('badminton.group.removeScore')"
                    >×</button>
                  </div>
                  <button
                    v-if="groupSection === 'createMatch'"
                    class="btn small secondary"
                    :disabled="!canAddMatchScore"
                    @click="addScore('team1')"
                  >+</button>
                </div>
              </div>
            </div>

            <div class="formSection">
              <div class="sectionTitle">{{ $t('badminton.group.team2') }}</div>
              <ParticipantSearchSelect
                v-if="!matchForm.team2P1"
                :group-id="groupId"
                :exclude-ids="matchSelectedParticipantIds"
                :placeholder="$t('common.placeholders.searchParticipant')"
                @select="selectParticipant('team2P1', $event)"
              />
              <div v-if="matchForm.team2P1" class="selectedParticipant">
                <PersonChip
                  :name="getParticipantName(matchForm.team2P1)"
                  :photo-url="getParticipantPhoto(matchForm.team2P1)"
                  :photo-crop="getParticipantCrop(matchForm.team2P1)"
                  :username="getParticipantUsername(matchForm.team2P1)"
                />
                <button class="btn small danger" @click="matchForm.team2P1 = null">×</button>
              </div>

              <div class="scoresRow">
                <div class="scoresLabel">{{ $t('badminton.group.scores') }}:</div>
                <div class="scoresInputs">
                  <div v-for="(score, idx) in matchForm.team2Scores" :key="'t2-' + idx" class="scoreInputWrapper">
                    <input
                      type="number"
                      class="scoreInput"
                      v-model.number="matchForm.team2Scores[idx]"
                      :placeholder="$t('badminton.group.scorePlaceholder')"
                      min="0"
                      max="30"
                    />
                    <button
                      v-if="matchForm.team2Scores.length > 1"
                      class="btn small danger scoreRemoveBtn"
                      @click="removeScore('team2', idx)"
                      :title="$t('badminton.group.removeScore')"
                    >×</button>
                  </div>
                  <button
                    v-if="groupSection === 'createMatch'"
                    class="btn small secondary"
                    :disabled="!canAddMatchScore"
                    @click="addScore('team2')"
                  >+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Doubles match form -->
          <div v-else class="matchForm">
            <div class="formSection">
              <div class="sectionTitle">{{ $t('badminton.group.team1') }}</div>
              <ParticipantSearchSelect
                v-if="!matchForm.team1P1"
                :group-id="groupId"
                :exclude-ids="matchSelectedParticipantIds"
                :placeholder="$t('common.placeholders.searchParticipant1')"
                @select="selectParticipant('team1P1', $event)"
              />
              <div v-if="matchForm.team1P1" class="selectedParticipant">
                <PersonChip
                  :name="getParticipantName(matchForm.team1P1)"
                  :photo-url="getParticipantPhoto(matchForm.team1P1)"
                  :photo-crop="getParticipantCrop(matchForm.team1P1)"
                  :username="getParticipantUsername(matchForm.team1P1)"
                />
                <button class="btn small danger" @click="matchForm.team1P1 = null">×</button>
              </div>

              <ParticipantSearchSelect
                v-if="!matchForm.team1P2"
                :group-id="groupId"
                :exclude-ids="matchSelectedParticipantIds"
                :placeholder="$t('common.placeholders.searchParticipant2')"
                @select="selectParticipant('team1P2', $event)"
              />
              <div v-if="matchForm.team1P2" class="selectedParticipant">
                <PersonChip
                  :name="getParticipantName(matchForm.team1P2)"
                  :photo-url="getParticipantPhoto(matchForm.team1P2)"
                  :photo-crop="getParticipantCrop(matchForm.team1P2)"
                  :username="getParticipantUsername(matchForm.team1P2)"
                />
                <button class="btn small danger" @click="matchForm.team1P2 = null">×</button>
              </div>

              <div class="scoresRow">
                <div class="scoresLabel">{{ $t('badminton.group.scores') }}:</div>
                <div class="scoresInputs">
                  <div v-for="(score, idx) in matchForm.team1Scores" :key="'dt1-' + idx" class="scoreInputWrapper">
                    <input
                      type="number"
                      class="scoreInput"
                      v-model.number="matchForm.team1Scores[idx]"
                      :placeholder="$t('badminton.group.scorePlaceholder')"
                      min="0"
                      max="30"
                    />
                    <button
                      v-if="matchForm.team1Scores.length > 1"
                      class="btn small danger scoreRemoveBtn"
                      @click="removeScore('team1', idx)"
                      :title="$t('badminton.group.removeScore')"
                    >×</button>
                  </div>
                  <button
                    v-if="groupSection === 'createMatch'"
                    class="btn small secondary"
                    :disabled="!canAddMatchScore"
                    @click="addScore('team1')"
                  >+</button>
                </div>
              </div>
            </div>

            <div class="formSection">
              <div class="sectionTitle">{{ $t('badminton.group.team2') }}</div>
              <ParticipantSearchSelect
                v-if="!matchForm.team2P1"
                :group-id="groupId"
                :exclude-ids="matchSelectedParticipantIds"
                :placeholder="$t('common.placeholders.searchParticipant1')"
                @select="selectParticipant('team2P1', $event)"
              />
              <div v-if="matchForm.team2P1" class="selectedParticipant">
                <PersonChip
                  :name="getParticipantName(matchForm.team2P1)"
                  :photo-url="getParticipantPhoto(matchForm.team2P1)"
                  :photo-crop="getParticipantCrop(matchForm.team2P1)"
                  :username="getParticipantUsername(matchForm.team2P1)"
                />
                <button class="btn small danger" @click="matchForm.team2P1 = null">×</button>
              </div>

              <ParticipantSearchSelect
                v-if="!matchForm.team2P2"
                :group-id="groupId"
                :exclude-ids="matchSelectedParticipantIds"
                :placeholder="$t('common.placeholders.searchParticipant2')"
                @select="selectParticipant('team2P2', $event)"
              />
              <div v-if="matchForm.team2P2" class="selectedParticipant">
                <PersonChip
                  :name="getParticipantName(matchForm.team2P2)"
                  :photo-url="getParticipantPhoto(matchForm.team2P2)"
                  :photo-crop="getParticipantCrop(matchForm.team2P2)"
                  :username="getParticipantUsername(matchForm.team2P2)"
                />
                <button class="btn small danger" @click="matchForm.team2P2 = null">×</button>
              </div>

              <div class="scoresRow">
                <div class="scoresLabel">{{ $t('badminton.group.scores') }}:</div>
                <div class="scoresInputs">
                  <div v-for="(score, idx) in matchForm.team2Scores" :key="'dt2-' + idx" class="scoreInputWrapper">
                    <input
                      type="number"
                      class="scoreInput"
                      v-model.number="matchForm.team2Scores[idx]"
                      :placeholder="$t('badminton.group.scorePlaceholder')"
                      min="0"
                      max="30"
                    />
                    <button
                      v-if="matchForm.team2Scores.length > 1"
                      class="btn small danger scoreRemoveBtn"
                      @click="removeScore('team2', idx)"
                      :title="$t('badminton.group.removeScore')"
                    >×</button>
                  </div>
                  <button
                    v-if="groupSection === 'createMatch'"
                    class="btn small secondary"
                    :disabled="!canAddMatchScore"
                    @click="addScore('team2')"
                  >+</button>
                </div>
              </div>
            </div>
          </div>

          <div class="row formActions">
            <button class="btn" :disabled="formSaving || !canSaveMatch" @click="saveMatch">
              {{ groupSection === 'editMatch' ? $t('common.actions.save') : $t('common.actions.create') }}
            </button>
            <button class="btn secondary" :disabled="formSaving" @click="cancelToMatches">{{ $t('common.actions.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import PagerBar from "@/components/badminton/PagerBar.vue";
import BadmintonPillNav from "@/components/badminton/BadmintonPillNav.vue";
import PersonChip from "@/components/badminton/PersonChip.vue";
import PhotoHoldPreview from "@/components/badminton/PhotoHoldPreview.vue";
import ProfileEditForm from "@/components/badminton/ProfileEditForm.vue";
import ParticipantSearchSelect from "@/components/badminton/ParticipantSearchSelect.vue";
import BadmintonNotificationBell from "@/components/badminton/BadmintonNotificationBell.vue";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";
import { badmintonClient } from "@/badminton/client.js";
import { getLoggedInUserId } from "@/badminton/cookies.js";
import { formatElo } from "@/badminton/formatElo.js";
import { participantPhotoFileFromPaste } from "@/badminton/photoUpload.js";
import { getGroupMatchTab } from "@/badminton/uiPrefs.js";
import { redirectToLoginAutoTg } from "@/badminton/apiHelpers.js";
const CYRILLIC_TO_LATIN = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export default defineComponent({
  name: "BadmintonGroup",
  components: { PagerBar, BadmintonPillNav, PersonChip, PhotoHoldPreview, ProfileEditForm, ParticipantSearchSelect, BadmintonNotificationBell, LocaleSwitcher },
  props: {
    groupId: { type: String, required: true },
    groupSection: { type: String, default: "matches" },
    /** 'singles' | 'doubles' — внутри «Матчи»/лидербордов; fallback — remembered pref */
    matchTab: { type: String, default: "" },
    participantId: { type: String, default: null },
    matchId: { type: String, default: null },
  },
  data() {
    return {
      loading: false,
      error: "",
      inviteNotice: "",
      group: null,
      participantNameMap: {},
      participantPhotoMap: {},
      participantCropMap: {},
      participantUsernameMap: {},
      participantsPages: [],
      participantsPageIndex: 0,
      participantsLimit: 10,
      participantsLimitOptions: [10, 20, 50],
      showParticipantsLimitDropdown: false,
      participantsQuery: "",
      participantsQueryTimer: null,

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
      inviteUserSearch: { items: [], nextPageToken: null, loading: false, open: false },
      inviteUserSearchTimer: null,

      newUnlinkedFirstName: "",
      newUnlinkedLastName: "",
      newUnlinkedUsername: "",
      newUnlinkedUsernameTouched: false,
      newUnlinkedPhotoUrl: "",
      loadingAddUnlinked: false,
      uploadingUnlinkedPhoto: false,
      uploadingEditPhoto: false,

      editParticipantForm: {
        firstName: "",
        lastName: "",
        originalFirstName: "",
        originalLastName: "",
        photoUrl: "",
        photoCrop: null,
        originalPhotoCrop: null,
        photoTouched: false,
        photoCleared: false,
        cropTouched: false,
      },
      linkUserForm: { userId: "", query: "", selected: null },
      linkUserSearch: { items: [], nextPageToken: null, loading: false, open: false },
      linkUserSearchTimer: null,
      matchForm: {
        matchId: "",
        kind: "doubles",
        team1P1: null,
        team1P2: null,
        team2P1: null,
        team2P2: null,
        team1Scores: [21],
        team2Scores: [21],
      },
      formSaving: false,
    };
  },
  computed: {
    isStaff() {
      return this.group?.myRole === "admin";
    },
    isMatchEditor() {
      return this.isStaff || this.group?.myRole === "editor";
    },
    assignableRoles() {
      return ["member", "editor", "admin"];
    },
    meId() {
      return getLoggedInUserId() || null;
    },
    matchSelectedParticipantIds() {
      const p = this.matchForm || {};
      return [p.team1P1, p.team1P2, p.team2P1, p.team2P2].filter(Boolean);
    },
    showInviteUserDropdown() {
      return this.inviteUserSearch.open && (
        this.inviteUserSearch.loading
        || this.inviteUserSearch.items.length > 0
        || Boolean(String(this.newParticipantName || "").trim())
      );
    },
    showLinkUserDropdown() {
      return this.linkUserSearch.open && (
        this.linkUserSearch.loading
        || this.linkUserSearch.items.length > 0
        || Boolean(String(this.linkUserForm.query || "").trim())
      );
    },
    canCreateUnlinked() {
      return Boolean(
        String(this.newUnlinkedFirstName || "").trim()
        && String(this.newUnlinkedLastName || "").trim()
        && String(this.newUnlinkedUsername || "").trim()
      );
    },
    isParticipantsNavActive() {
      return ["participants", "editParticipant", "linkUser"].includes(this.groupSection);
    },
    isMatchesNavActive() {
      return ["matches", "createMatch", "editMatch"].includes(this.groupSection);
    },
    isLeaderboardsNavActive() {
      return this.groupSection === "leaderboards";
    },
    leaderboardCardTitle() {
      return this.effectiveMatchTab === "doubles"
        ? this.$t("badminton.group.doublesLeaderboard")
        : this.$t("badminton.group.singlesLeaderboard");
    },
    matchFormTitle() {
      const kind = this.matchForm.kind === "singles"
        ? this.$t("badminton.group.singles")
        : this.$t("badminton.group.doubles");
      return this.groupSection === "editMatch"
        ? this.$t("badminton.group.editMatch", { kind })
        : this.$t("badminton.group.createMatch", { kind });
    },
    createMatchLabel() {
      const kind = this.effectiveMatchTab === "doubles"
        ? this.$t("badminton.group.doubles")
        : this.$t("badminton.group.singles");
      return this.$t("badminton.group.createMatch", { kind });
    },
    canSaveMatch() {
      const p = this.matchForm;
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
    canAddMatchScore() {
      const n = Math.max(
        (this.matchForm.team1Scores || []).length,
        (this.matchForm.team2Scores || []).length
      );
      return n < 5;
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
    effectiveMatchTab() {
      const t = String(this.matchTab || getGroupMatchTab() || "doubles").toLowerCase();
      return t === "singles" ? "singles" : "doubles";
    },
    noMatchesForCurrentTab() {
      return this.effectiveMatchTab === "singles"
        ? this.singlesMatches.length === 0
        : this.doublesMatches.length === 0;
    },
    groupMatchesNavItems() {
      const tab = this.effectiveMatchTab;
      return [
        {
          to: this.matchesSubNavTo("doubles"),
          label: this.$t("badminton.groups.myDoublesMatches"),
          active: tab === "doubles",
        },
        {
          to: this.matchesSubNavTo("singles"),
          label: this.$t("badminton.groups.mySinglesMatches"),
          active: tab === "singles",
        },
      ];
    },
    groupLeaderboardsNavItems() {
      const tab = this.effectiveMatchTab;
      return [
        {
          to: this.leaderboardsSubNavTo("doubles"),
          label: this.$t("badminton.group.doublesLeaderboard"),
          active: tab === "doubles",
        },
        {
          to: this.leaderboardsSubNavTo("singles"),
          label: this.$t("badminton.group.singlesLeaderboard"),
          active: tab === "singles",
        },
      ];
    },
  },
  watch: {
    groupSection() {
      this.normalizeMatchesQueryThenLoad();
    },
    matchTab() {
      if (
        this.groupSection === "matches"
        || this.groupSection === "createMatch"
        || this.groupSection === "editMatch"
        || this.groupSection === "leaderboards"
      ) {
        this.loadSection();
      }
    },
    participantId() {
      if (this.groupSection === "editParticipant" || this.groupSection === "linkUser") {
        this.loadSection();
      }
    },
    matchId() {
      if (this.groupSection === "editMatch") this.loadSection();
    },
    groupId() {
      this.loadGroup().then(() => this.normalizeMatchesQueryThenLoad());
    },
  },
  mounted() {
    if (redirectToLoginAutoTg(this.$router)) return;
    this.loadGroup().then(() => this.normalizeMatchesQueryThenLoad());
  },
  beforeUnmount() {
    if (this.participantsQueryTimer) clearTimeout(this.participantsQueryTimer);
    if (this.inviteUserSearchTimer) clearTimeout(this.inviteUserSearchTimer);
    if (this.linkUserSearchTimer) clearTimeout(this.linkUserSearchTimer);
  },
  methods: {
    formatElo,
    mergeParticipantNames(items) {
      const nameMap = { ...this.participantNameMap };
      const photoMap = { ...this.participantPhotoMap };
      const cropMap = { ...this.participantCropMap };
      const usernameMap = { ...this.participantUsernameMap };
      (items || []).forEach(p => {
        nameMap[p.id] = p.name;
        if (p.photoUrl) photoMap[p.id] = p.photoUrl;
        else delete photoMap[p.id];
        if (p.photoCrop) cropMap[p.id] = p.photoCrop;
        else delete cropMap[p.id];
        if (p.username) usernameMap[p.id] = p.username;
      });
      this.participantNameMap = nameMap;
      this.participantPhotoMap = photoMap;
      this.participantCropMap = cropMap;
      this.participantUsernameMap = usernameMap;
    },
    formatRole(role) {
      const key = `badminton.roles.${role}`;
      const translated = this.$t(key);
      return translated === key ? role : translated;
    },
    participantRoleKey(participant) {
      if (participant?.id && participant.id === this.meId && this.group?.isOwner) {
        return "owner";
      }
      return participant?.role || "member";
    },
    canAssignRole(participant) {
      if (this.isUnlinkedParticipant(participant)) return false;
      if (this.group?.isOwner) {
        return participant.id !== this.meId;
      }
      if (this.group?.myRole === "admin") {
        return participant.role === "member" || participant.role === "editor";
      }
      return false;
    },
    async onParticipantRoleChange(participant, role) {
      if (!this.groupId || !participant?.id || role === participant.role) return;
      this.formSaving = true;
      this.error = "";
      try {
        await badmintonClient.updateParticipantRole(this.groupId, participant.id, {role});
        await this.reloadParticipantsFirstPage();
        this.group = await badmintonClient.getGroup(this.groupId);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errUpdateParticipant");
        await this.reloadParticipantsFirstPage();
      } finally {
        this.formSaving = false;
      }
    },
    async transferOwnership(participant) {
      if (!this.groupId || !participant?.id) return;
      if (!window.confirm(this.$t("badminton.group.confirmTransferOwner"))) return;
      this.formSaving = true;
      this.error = "";
      try {
        this.group = await badmintonClient.transferGroupOwnership(this.groupId, {userId: participant.id});
        await this.reloadParticipantsFirstPage();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errTransferOwner");
      } finally {
        this.formSaving = false;
      }
    },
    participantsListTo() {
      const gid = encodeURIComponent(this.groupId);
      return `/?page=badminton&section=groups&groupId=${gid}&groupSection=participants`;
    },
    matchesListTo(tab = this.effectiveMatchTab) {
      const gid = encodeURIComponent(this.groupId);
      const t = tab === "singles" ? "singles" : "doubles";
      return `/?page=badminton&section=groups&groupId=${gid}&groupSection=matches&matchTab=${t}`;
    },
    isUnlinkedParticipant(participant) {
      return Boolean(participant?.groupId);
    },
    editParticipantTo(participantId) {
      const gid = encodeURIComponent(this.groupId);
      const pid = encodeURIComponent(participantId);
      return `/?page=badminton&section=groups&groupId=${gid}&groupSection=editParticipant&participantId=${pid}`;
    },
    linkUserTo(participantId) {
      const gid = encodeURIComponent(this.groupId);
      const pid = encodeURIComponent(participantId);
      return `/?page=badminton&section=groups&groupId=${gid}&groupSection=linkUser&participantId=${pid}`;
    },
    createMatchTo(kind) {
      const gid = encodeURIComponent(this.groupId);
      const tab = kind === "singles" ? "singles" : "doubles";
      return `/?page=badminton&section=groups&groupId=${gid}&groupSection=createMatch&matchTab=${tab}`;
    },
    editMatchTo(m) {
      const gid = encodeURIComponent(this.groupId);
      const mid = encodeURIComponent(m.id);
      const tab = m.kind === "singles" ? "singles" : "doubles";
      return `/?page=badminton&section=groups&groupId=${gid}&groupSection=editMatch&matchId=${mid}&matchTab=${tab}`;
    },
    matchesSubNavTo(tab) {
      const gid = encodeURIComponent(this.groupId);
      return `/?page=badminton&section=groups&groupId=${gid}&groupSection=matches&matchTab=${tab}`;
    },
    leaderboardsSubNavTo(tab = this.effectiveMatchTab) {
      const gid = encodeURIComponent(this.groupId);
      const t = tab === "singles" ? "singles" : "doubles";
      return `/?page=badminton&section=groups&groupId=${gid}&groupSection=leaderboards&matchTab=${t}`;
    },
    cancelToParticipants() {
      this.$router.push(this.participantsListTo());
    },
    cancelToMatches() {
      this.$router.push(this.matchesListTo(this.matchForm.kind || this.effectiveMatchTab));
    },
    emptyMatchForm(kind, matchId = "") {
      return {
        matchId: matchId || "",
        kind: kind === "singles" ? "singles" : "doubles",
        team1P1: null,
        team1P2: null,
        team2P1: null,
        team2P2: null,
        team1Scores: [21],
        team2Scores: [21],
      };
    },
    matchFormFromMatch(m) {
      const games = m.score?.games || [];
      const team1Scores = games.length > 0 ? [games[0].pointsA] : [null];
      const team2Scores = games.length > 0 ? [games[0].pointsB] : [null];
      if (m.kind === "singles") {
        return {
          matchId: m.id,
          kind: "singles",
          team1P1: m.teamA?.[0] || null,
          team1P2: null,
          team1Scores,
          team2P1: m.teamB?.[0] || null,
          team2P2: null,
          team2Scores,
        };
      }
      return {
        matchId: m.id,
        kind: "doubles",
        team1P1: m.teamA?.[0] || null,
        team1P2: m.teamA?.[1] || null,
        team1Scores,
        team2P1: m.teamB?.[0] || null,
        team2P2: m.teamB?.[1] || null,
        team2Scores,
      };
    },
    async normalizeMatchesQueryThenLoad() {
      if (
        this.groupSection === "matches"
        || this.groupSection === "createMatch"
        || this.groupSection === "editMatch"
        || this.groupSection === "leaderboards"
      ) {
        const q = this.$route.query;
        const mt = String(q.matchTab || "").toLowerCase();
        if (mt !== "singles" && mt !== "doubles") {
          const { getGroupMatchTab } = await import("@/badminton/uiPrefs.js");
          await this.$router.replace({ query: { ...q, matchTab: getGroupMatchTab() } });
        }
      }
      await this.loadSection();
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
          await this.reloadParticipantsFirstPage();
        } else if (this.groupSection === "editParticipant") {
          await this.loadEditParticipantForm();
        } else if (this.groupSection === "linkUser") {
          this.linkUserForm = { userId: "", query: "", selected: null };
          this.linkUserSearch = { items: [], nextPageToken: null, loading: false, open: false };
          if (!this.participantId) {
            this.error = this.$t("badminton.group.errUpdateParticipant");
          } else {
            badmintonClient.listAllParticipants(this.groupId)
              .then(res => this.mergeParticipantNames(res?.items || []))
              .catch(() => {});
          }
        } else if (this.groupSection === "createMatch") {
          const kind = this.effectiveMatchTab;
          this.matchForm = this.emptyMatchForm(kind);
          const participantsRes = await badmintonClient.listAllParticipants(this.groupId);
          this.mergeParticipantNames(participantsRes?.items || []);
        } else if (this.groupSection === "editMatch") {
          await this.loadEditMatchForm();
        } else if (this.groupSection === "matches") {
          const tab = this.effectiveMatchTab;
          const needSingles = tab === "singles";
          const needDoubles = tab === "doubles";
          const [participantsRes, singlesRes, doublesRes] = await Promise.all([
            badmintonClient.listAllParticipants(this.groupId),
            needSingles
              ? badmintonClient.listGroupSinglesMatches(this.groupId, { limit: this.singlesLimit })
              : Promise.resolve({ items: [], pageToken: null }),
            needDoubles
              ? badmintonClient.listGroupDoublesMatches(this.groupId, { limit: this.doublesLimit })
              : Promise.resolve({ items: [], pageToken: null }),
          ]);
          this.mergeParticipantNames(participantsRes?.items || []);
          if (needSingles) {
            this.singlesPages = [{ items: singlesRes?.items || [], pageToken: singlesRes?.pageToken || null }];
            this.singlesPageIndex = 0;
          } else {
            this.singlesPages = [];
            this.singlesPageIndex = 0;
          }
          if (needDoubles) {
            this.doublesPages = [{ items: doublesRes?.items || [], pageToken: doublesRes?.pageToken || null }];
            this.doublesPageIndex = 0;
          } else {
            this.doublesPages = [];
            this.doublesPageIndex = 0;
          }
        } else if (this.groupSection === "leaderboards") {
          await this.loadLeaderboards();
        }
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLoad");
      } finally {
        this.loading = false;
      }
    },
    async loadEditParticipantForm() {
      if (!this.participantId) {
        this.error = this.$t("badminton.group.errUpdateParticipant");
        return;
      }
      const res = await badmintonClient.listAllParticipants(this.groupId);
      const items = res?.items || [];
      this.mergeParticipantNames(items);
      const p = items.find(x => x.id === this.participantId);
      if (!p) {
        this.error = this.$t("badminton.group.errUpdateParticipant");
        return;
      }
      if (!this.isUnlinkedParticipant(p)) {
        await this.$router.replace(this.participantsListTo());
        return;
      }
      const firstName = String(p.firstName ?? "").trim();
      const lastName = String(p.lastName ?? "").trim();
      this.editParticipantForm = {
        firstName,
        lastName,
        originalFirstName: firstName,
        originalLastName: lastName,
        photoUrl: p.photoUrl || this.getParticipantPhoto(p.id) || "",
        photoCrop: p.photoCrop || null,
        originalPhotoCrop: p.photoCrop || null,
        photoTouched: false,
        photoCleared: false,
        cropTouched: false,
      };
    },
    async findMatchById(matchId, kind) {
      const pages = kind === "doubles" ? this.doublesPages : this.singlesPages;
      for (const page of pages || []) {
        const found = (page.items || []).find(m => m.id === matchId);
        if (found) return found;
      }
      const fetcher = kind === "doubles"
        ? (opts) => badmintonClient.listGroupDoublesMatches(this.groupId, opts)
        : (opts) => badmintonClient.listGroupSinglesMatches(this.groupId, opts);
      let pageToken = null;
      for (let i = 0; i < 20; i++) {
        const res = await fetcher({ limit: 50, pageToken });
        const found = (res?.items || []).find(m => m.id === matchId);
        if (found) return found;
        pageToken = res?.pageToken || null;
        if (!pageToken) break;
      }
      return null;
    },
    async loadEditMatchForm() {
      const kind = this.effectiveMatchTab;
      const participantsRes = await badmintonClient.listAllParticipants(this.groupId);
      this.mergeParticipantNames(participantsRes?.items || []);
      if (!this.matchId) {
        this.error = this.$t("badminton.group.errSaveMatch");
        this.matchForm = this.emptyMatchForm(kind);
        return;
      }
      const m = await this.findMatchById(this.matchId, kind);
      if (!m) {
        this.error = this.$t("badminton.group.errSaveMatch");
        this.matchForm = this.emptyMatchForm(kind, this.matchId);
        return;
      }
      this.matchForm = this.matchFormFromMatch(m);
    },
    async fetchParticipantsPage({ limit, pageToken } = {}) {
      const query = String(this.participantsQuery || "").trim();
      if (query) {
        return badmintonClient.searchParticipants(this.groupId, {
          query,
          limit: limit ?? this.participantsLimit,
          pageToken,
        });
      }
      return badmintonClient.listParticipants(this.groupId, {
        limit: limit ?? this.participantsLimit,
        pageToken,
      });
    },
    async reloadParticipantsFirstPage() {
      const res = await this.fetchParticipantsPage({ limit: this.participantsLimit });
      const pItems = res?.items || [];
      this.participantsPages = [{ items: pItems, pageToken: res?.pageToken || null }];
      this.participantsPageIndex = 0;
      this.mergeParticipantNames(pItems);
    },
    onParticipantsQueryInput() {
      if (this.participantsQueryTimer) clearTimeout(this.participantsQueryTimer);
      this.participantsQueryTimer = setTimeout(() => {
        this.applyParticipantsQuery();
      }, 200);
    },
    async applyParticipantsQuery() {
      if (this.groupSection !== "participants" || !this.groupId) return;
      this.loading = true;
      this.error = "";
      try {
        await this.reloadParticipantsFirstPage();
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
        const res = await this.fetchParticipantsPage({
          limit: this.participantsLimit,
          pageToken: nextToken,
        });
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
        await this.reloadParticipantsFirstPage();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLoad");
      } finally {
        this.loading = false;
      }
    },
    refresh() {
      this.loadGroup().then(() => this.normalizeMatchesQueryThenLoad());
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
        const res = await badmintonClient.listGroupSinglesMatches(this.groupId, { limit: this.singlesLimit, pageToken: nextToken });
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
        const res = await badmintonClient.listGroupSinglesMatches(this.groupId, { limit });
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
        const res = await badmintonClient.listGroupDoublesMatches(this.groupId, { limit: this.doublesLimit, pageToken: nextToken });
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
        const res = await badmintonClient.listGroupDoublesMatches(this.groupId, { limit });
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
        const needSingles = this.effectiveMatchTab === "singles";
        const [participantsRes, lbRes] = await Promise.all([
          badmintonClient.listAllParticipants(this.groupId),
          needSingles
            ? badmintonClient.getSinglesLeaderboard(this.groupId, { limit: this.lbLimit })
            : badmintonClient.getDoublesLeaderboard(this.groupId, { limit: this.lbLimit }),
        ]);
        this.mergeParticipantNames(participantsRes?.items || []);
        const page = { items: lbRes?.items || [], pageToken: lbRes?.pageToken || null };
        if (needSingles) {
          this.singlesLbPages = [page];
          this.singlesLbPageIndex = 0;
          this.doublesLbPages = [];
          this.doublesLbPageIndex = 0;
        } else {
          this.doublesLbPages = [page];
          this.doublesLbPageIndex = 0;
          this.singlesLbPages = [];
          this.singlesLbPageIndex = 0;
        }
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
    getParticipantPhoto(participantId) {
      if (!participantId) return "";
      return this.participantPhotoMap[participantId] || "";
    },
    getParticipantCrop(participantId) {
      if (!participantId) return null;
      return this.participantCropMap[participantId] || null;
    },
    getParticipantUsername(participantId) {
      if (!participantId) return "";
      return this.participantUsernameMap[participantId] || "";
    },
    pairParticipantIds(pairKey) {
      if (!pairKey) return [];
      return String(pairKey).split(":").filter(Boolean);
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
        if (Number.isNaN(d.getTime()) || d.getTime() === 0) return this.$t("common.misc.noData");
        const locale = this.$i18n.locale === "ru" ? "ru-RU" : "en-US";
        return d.toLocaleString(locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return dateStr;
      }
    },

    async addParticipant() {
      this.loadingAddParticipant = true;
      this.error = "";
      this.inviteUserSearch.open = false;
      try {
        await badmintonClient.createParticipant(this.groupId, {name: this.newParticipantName});
        this.newParticipantName = "";
        this.inviteUserSearch = { items: [], nextPageToken: null, loading: false, open: false };
        this.inviteNotice = this.$t("badminton.group.inviteSent");
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errInviteParticipant");
      } finally {
        this.loadingAddParticipant = false;
      }
    },

    inviteUserLabel(user) {
      const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
      return fullName || user?.username || user?.id || "—";
    },

    onInviteUserSearchFocus() {
      this.inviteUserSearch.open = true;
      badmintonClient.listAllParticipants(this.groupId)
        .then(res => this.mergeParticipantNames(res?.items || []))
        .catch(() => {})
        .finally(() => {
          if (this.inviteUserSearch.items.length === 0 && !this.inviteUserSearch.loading) {
            this.loadInviteUsers(false);
          }
        });
    },

    onInviteUserSearchInput() {
      this.inviteUserSearch.open = true;
      if (this.inviteUserSearchTimer) clearTimeout(this.inviteUserSearchTimer);
      this.inviteUserSearchTimer = setTimeout(() => {
        this.inviteUserSearch.items = [];
        this.inviteUserSearch.nextPageToken = null;
        this.loadInviteUsers(false);
      }, 250);
    },

    async loadInviteUsers(append = false) {
      if (!this.groupId || !this.isStaff) return;
      if (this.inviteUserSearch.loading) return;
      if (append && !this.inviteUserSearch.nextPageToken) return;
      this.inviteUserSearch.loading = true;
      try {
        const result = await badmintonClient.searchUsers({
          query: String(this.newParticipantName || "").trim(),
          registeredOnly: true,
          limit: 10,
          pageToken: append ? this.inviteUserSearch.nextPageToken : undefined,
        });
        const memberIds = new Set(Object.keys(this.participantNameMap || {}));
        const items = (result?.items || []).filter(u => !memberIds.has(u.id));
        if (append) {
          const existingIds = new Set(this.inviteUserSearch.items.map(u => u.id));
          this.inviteUserSearch.items = [
            ...this.inviteUserSearch.items,
            ...items.filter(u => !existingIds.has(u.id)),
          ];
        } else {
          this.inviteUserSearch.items = items;
        }
        this.inviteUserSearch.nextPageToken = result?.pageToken || null;
      } catch (e) {
        if (!append) this.inviteUserSearch.items = [];
        this.inviteUserSearch.nextPageToken = null;
      } finally {
        this.inviteUserSearch.loading = false;
      }
    },

    onInviteUserDropdownScroll(event) {
      const target = event.target;
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (scrollBottom < 50 && this.inviteUserSearch.nextPageToken && !this.inviteUserSearch.loading) {
        this.loadInviteUsers(true);
      }
    },

    selectInviteUser(user) {
      this.newParticipantName = user?.username || "";
      this.inviteUserSearch.open = false;
    },

    onLinkUserSearchFocus() {
      this.linkUserSearch.open = true;
      if (this.linkUserSearch.items.length === 0 && !this.linkUserSearch.loading) {
        this.loadLinkUsers(false);
      }
    },

    onLinkUserSearchInput() {
      this.linkUserSearch.open = true;
      if (this.linkUserSearchTimer) clearTimeout(this.linkUserSearchTimer);
      this.linkUserSearchTimer = setTimeout(() => {
        this.linkUserSearch.items = [];
        this.linkUserSearch.nextPageToken = null;
        this.loadLinkUsers(false);
      }, 250);
    },

    async loadLinkUsers(append = false) {
      if (!this.groupId || !this.isStaff) return;
      if (this.linkUserSearch.loading) return;
      if (append && !this.linkUserSearch.nextPageToken) return;
      this.linkUserSearch.loading = true;
      try {
        const result = await badmintonClient.searchUsers({
          query: String(this.linkUserForm.query || "").trim(),
          registeredOnly: true,
          limit: 10,
          pageToken: append ? this.linkUserSearch.nextPageToken : undefined,
        });
        const memberIds = new Set(Object.keys(this.participantNameMap || {}));
        const items = (result?.items || []).filter(u => !memberIds.has(u.id));
        if (append) {
          const existingIds = new Set(this.linkUserSearch.items.map(u => u.id));
          this.linkUserSearch.items = [
            ...this.linkUserSearch.items,
            ...items.filter(u => !existingIds.has(u.id)),
          ];
        } else {
          this.linkUserSearch.items = items;
        }
        this.linkUserSearch.nextPageToken = result?.pageToken || null;
      } catch (e) {
        if (!append) this.linkUserSearch.items = [];
        this.linkUserSearch.nextPageToken = null;
      } finally {
        this.linkUserSearch.loading = false;
      }
    },

    onLinkUserDropdownScroll(event) {
      const target = event.target;
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (scrollBottom < 50 && this.linkUserSearch.nextPageToken && !this.linkUserSearch.loading) {
        this.loadLinkUsers(true);
      }
    },

    selectLinkUser(user) {
      if (!user?.id) return;
      this.linkUserForm = {
        userId: user.id,
        query: user.username || "",
        selected: user,
      };
      this.linkUserSearch.open = false;
    },

    clearLinkUserSelection() {
      this.linkUserForm = { userId: "", query: "", selected: null };
      this.linkUserSearch = { items: [], nextPageToken: null, loading: false, open: false };
    },

    splitUnlinkedFirstNameIfNeeded() {
      const parts = String(this.newUnlinkedFirstName || "").trim().split(/\s+/).filter(Boolean);
      if (parts.length < 2) return false;
      this.newUnlinkedFirstName = parts[0];
      this.newUnlinkedLastName = parts.slice(1).join(" ");
      return true;
    },
    trimUnlinkedNames() {
      this.newUnlinkedFirstName = String(this.newUnlinkedFirstName || "").trim();
      this.newUnlinkedLastName = String(this.newUnlinkedLastName || "").trim();
    },
    syncUnlinkedUsernameFromName() {
      if (this.newUnlinkedUsernameTouched) return;
      this.newUnlinkedUsername = this.suggestUsernameFromName(
        this.newUnlinkedFirstName,
        this.newUnlinkedLastName
      );
    },
    onUnlinkedFirstNameInput() {
      this.splitUnlinkedFirstNameIfNeeded();
      this.syncUnlinkedUsernameFromName();
    },
    onUnlinkedLastNameInput() {
      this.syncUnlinkedUsernameFromName();
    },
    onUnlinkedFirstNameBlur() {
      this.splitUnlinkedFirstNameIfNeeded();
      this.trimUnlinkedNames();
      this.syncUnlinkedUsernameFromName();
    },
    onUnlinkedLastNameBlur() {
      this.trimUnlinkedNames();
      this.syncUnlinkedUsernameFromName();
    },

    suggestUsernameFromName(firstName, lastName) {
      const slug = (value) => {
        const mapped = String(value || "")
          .trim()
          .toLowerCase()
          .split("")
          .map((ch) => CYRILLIC_TO_LATIN[ch] || ch)
          .join("");
        return mapped
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, ".")
          .replace(/^\.+|\.+$/g, "");
      };
      const parts = [slug(firstName), slug(lastName)].filter(Boolean);
      if (parts.length) return parts.join(".");
      return `player.${Date.now().toString(36)}`;
    },

    isPreviewablePhotoUrl(url) {
      const value = String(url || "").trim();
      return value.startsWith("http://")
        || value.startsWith("https://")
        || value.startsWith("blob:");
    },
    photoUploadErrorMessage(error) {
      const code = error?.message;
      if (code === "photoTypeUnsupported") return this.$t("badminton.group.errPhotoType");
      if (code === "photoTooLarge") return this.$t("badminton.group.errPhotoTooLarge");
      if (code === "photoUploadFailed") return this.$t("badminton.group.errPhotoUpload");
      return error?.message || this.$t("badminton.group.errPhotoUpload");
    },
    onUnlinkedPhotoPaste(event) {
      if (this.uploadingUnlinkedPhoto || this.loadingAddUnlinked) return;
      const file = participantPhotoFileFromPaste(event);
      if (!file) return;
      event.preventDefault();
      this.uploadUnlinkedPhoto(file);
    },
    onEditPhotoPaste(event) {
      if (this.uploadingEditPhoto || this.formSaving) return;
      const file = participantPhotoFileFromPaste(event);
      if (!file) return;
      event.preventDefault();
      this.uploadEditPhoto(file);
    },
    async onUnlinkedPhotoFileChange(event) {
      const file = event?.target?.files?.[0];
      if (event?.target) event.target.value = "";
      if (!file) return;
      await this.uploadUnlinkedPhoto(file);
    },
    async onEditPhotoFileChange(event) {
      const file = event?.target?.files?.[0];
      if (event?.target) event.target.value = "";
      if (!file) return;
      await this.uploadEditPhoto(file);
    },
    async uploadUnlinkedPhoto(file) {
      this.uploadingUnlinkedPhoto = true;
      this.error = "";
      try {
        this.newUnlinkedPhotoUrl = await badmintonClient.uploadParticipantPhoto(this.groupId, file);
      } catch (e) {
        this.error = this.photoUploadErrorMessage(e);
      } finally {
        this.uploadingUnlinkedPhoto = false;
      }
    },
    async uploadEditPhoto(file) {
      this.uploadingEditPhoto = true;
      this.error = "";
      try {
        const publicUrl = await badmintonClient.uploadParticipantPhoto(this.groupId, file);
        this.editParticipantForm = {
          ...this.editParticipantForm,
          photoUrl: publicUrl,
          photoTouched: true,
          photoCleared: false,
          cropTouched: true,
          photoCrop: null,
        };
      } catch (e) {
        this.error = this.photoUploadErrorMessage(e);
      } finally {
        this.uploadingEditPhoto = false;
      }
    },
    clearUnlinkedPhoto() {
      this.newUnlinkedPhotoUrl = "";
    },
    onEditPhotoUrlInput() {
      this.editParticipantForm = {
        ...this.editParticipantForm,
        photoTouched: true,
        photoCleared: false,
        cropTouched: true,
        photoCrop: null,
      };
    },
    onEditPhotoCrop(crop) {
      this.editParticipantForm = {
        ...this.editParticipantForm,
        photoCrop: crop,
        cropTouched: true,
      };
    },
    clearEditParticipantPhoto() {
      this.editParticipantForm = {
        ...this.editParticipantForm,
        photoUrl: "",
        photoCrop: null,
        photoTouched: true,
        photoCleared: true,
        cropTouched: true,
      };
    },

    async addUnlinkedParticipant() {
      this.splitUnlinkedFirstNameIfNeeded();
      this.trimUnlinkedNames();
      this.syncUnlinkedUsernameFromName();
      if (!this.canCreateUnlinked) return;
      this.loadingAddUnlinked = true;
      this.error = "";
      try {
        const payload = {
          username: String(this.newUnlinkedUsername).trim(),
          firstName: String(this.newUnlinkedFirstName).trim(),
          lastName: String(this.newUnlinkedLastName).trim(),
        };
        if (this.newUnlinkedPhotoUrl) payload.photoUrl = this.newUnlinkedPhotoUrl;
        const p = await badmintonClient.createUnlinkedParticipant(this.groupId, payload);
        this.newUnlinkedFirstName = "";
        this.newUnlinkedLastName = "";
        this.newUnlinkedUsername = "";
        this.newUnlinkedUsernameTouched = false;
        this.newUnlinkedPhotoUrl = "";
        this.mergeParticipantNames([p]);
        if (this.participantsPages.length && this.participantsPageIndex === 0) {
          const first = this.participantsPages[0];
          this.participantsPages = [{ ...first, items: [p, ...(first.items || [])] }];
        }
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errAddParticipant");
      } finally {
        this.loadingAddUnlinked = false;
      }
    },

    async saveParticipantEdit() {
      if (!this.participantId) return;
      this.formSaving = true;
      this.error = "";
      try {
        const firstName = String(this.editParticipantForm.firstName || "").trim();
        const lastName = String(this.editParticipantForm.lastName || "").trim();
        const patch = {};
        if (firstName !== this.editParticipantForm.originalFirstName) {
          if (!firstName) {
            this.error = this.$t("badminton.group.errUpdateParticipant");
            return;
          }
          patch.firstName = firstName;
        }
        if (lastName !== this.editParticipantForm.originalLastName) {
          if (!lastName) {
            this.error = this.$t("badminton.group.errUpdateParticipant");
            return;
          }
          patch.lastName = lastName;
        }
        if (this.editParticipantForm.photoTouched) {
          patch.photoUrl = this.editParticipantForm.photoCleared ? "" : (this.editParticipantForm.photoUrl || "");
        }
        if (this.editParticipantForm.cropTouched && this.editParticipantForm.photoCrop) {
          patch.photoCrop = this.editParticipantForm.photoCrop;
        }
        if (patch.firstName == null && patch.lastName == null && patch.photoUrl === undefined && patch.photoCrop === undefined) {
          this.cancelToParticipants();
          return;
        }
        await badmintonClient.updateParticipant(this.groupId, this.participantId, patch);
        this.cancelToParticipants();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errUpdateParticipant");
      } finally {
        this.formSaving = false;
      }
    },

    async confirmLinkUser() {
      if (!this.participantId) return;
      this.formSaving = true;
      this.error = "";
      try {
        await badmintonClient.linkUserToParticipant(this.groupId, this.participantId, { userId: this.linkUserForm.userId });
        this.inviteNotice = this.$t("badminton.group.linkInviteSent");
        this.cancelToParticipants();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errLinkUser");
      } finally {
        this.formSaving = false;
      }
    },

    async removeParticipant(p) {
      if (!confirm(this.$t("badminton.group.confirmDeleteParticipant", { name: p.name }))) return;
      this.error = "";
      try {
        await badmintonClient.deleteParticipant(this.groupId, p.id);
        const { [p.id]: _, ...rest } = this.participantNameMap;
        this.participantNameMap = rest;
        const { [p.id]: __, ...photoRest } = this.participantPhotoMap;
        this.participantPhotoMap = photoRest;
        const { [p.id]: ____, ...cropRest } = this.participantCropMap;
        this.participantCropMap = cropRest;
        const { [p.id]: ___, ...usernameRest } = this.participantUsernameMap;
        this.participantUsernameMap = usernameRest;
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

    selectParticipant(field, participant) {
      this.matchForm[field] = participant.id;
      this.mergeParticipantNames([participant]);
    },
    addScore(team) {
      if (!this.canAddMatchScore) return;
      const field = `${team}Scores`;
      const otherTeam = team === "team1" ? "team2" : "team1";
      const otherField = `${otherTeam}Scores`;

      if (!this.matchForm[field]) {
        this.matchForm[field] = [21];
      }
      if (!this.matchForm[otherField]) {
        this.matchForm[otherField] = [21];
      }

      this.matchForm[field].push(21);
      this.matchForm[otherField].push(21);
    },
    removeScore(team, idx) {
      const field = `${team}Scores`;
      const otherTeam = team === "team1" ? "team2" : "team1";
      const otherField = `${otherTeam}Scores`;

      if (this.matchForm[field] && this.matchForm[field].length > idx) {
        this.matchForm[field].splice(idx, 1);
      }
      if (this.matchForm[otherField] && this.matchForm[otherField].length > idx) {
        this.matchForm[otherField].splice(idx, 1);
      }

      if (this.matchForm[field].length === 0) {
        this.matchForm[field] = [21];
      }
      if (this.matchForm[otherField].length === 0) {
        this.matchForm[otherField] = [21];
      }
    },
    async saveMatch() {
      this.formSaving = true;
      this.error = "";
      try {
        const payload = { kind: this.matchForm.kind };

        if (this.matchForm.kind === "singles") {
          payload.teamA = this.matchForm.team1P1 ? [this.matchForm.team1P1] : [];
          payload.teamB = this.matchForm.team2P1 ? [this.matchForm.team2P1] : [];
        } else {
          payload.teamA = [
            this.matchForm.team1P1,
            this.matchForm.team1P2,
          ].filter(Boolean);
          payload.teamB = [
            this.matchForm.team2P1,
            this.matchForm.team2P2,
          ].filter(Boolean);
        }

        const team1Scores = (this.matchForm.team1Scores || []).filter(s => s !== null && s !== undefined);
        const team2Scores = (this.matchForm.team2Scores || []).filter(s => s !== null && s !== undefined);
        const maxGames = Math.max(team1Scores.length, team2Scores.length);
        const games = [];
        for (let i = 0; i < maxGames; i++) {
          const score1 = team1Scores[i] || 0;
          const score2 = team2Scores[i] || 0;
          if (score1 > 0 || score2 > 0) {
            games.push({ pointsA: score1, pointsB: score2 });
          }
        }

        const kind = payload.kind;
        if (this.matchForm.matchId) {
          const updateBody = {
            teamA: payload.teamA,
            teamB: payload.teamB,
            score: games[0],
          };
          await badmintonClient.updateMatch(this.groupId, this.matchForm.matchId, updateBody, kind);
        } else {
          payload.score = { games };
          await badmintonClient.createMatch(this.groupId, payload);
        }
        await this.$router.push(this.matchesListTo(kind));
      } catch (e) {
        this.error = e?.message || this.$t("badminton.group.errSaveMatch");
      } finally {
        this.formSaving = false;
      }
    },
    async removeMatch(m) {
      if (!confirm(this.$t("badminton.group.confirmDeleteMatch", { id: m.id }))) return;
      this.error = "";
      try {
        await badmintonClient.deleteMatch(this.groupId, m.id, m.kind);
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
  },
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 64px; max-width: 100%; box-sizing: border-box; }
.content { padding: 24px 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.crumbs { font-family: var(--font-display); display: flex; gap: 8px; align-items: center; }
.crumb { text-decoration: none; color: #4F3DFF; font-weight: 700; }
.crumb.current { color: black; font-weight: 700; }
.sep { opacity: 0.6; }
.title { margin: 4px 0 0 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }
.topActions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

.roleCell { vertical-align: middle; white-space: nowrap; }
.rolePill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  border: 1.5px solid transparent;
  box-sizing: border-box;
}
.roleSelectWrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border-radius: 999px;
  border: 1.5px solid transparent;
  box-sizing: border-box;
}
.roleSelect {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  padding: 6px 28px 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  min-width: 7.5rem;
  max-width: 100%;
  width: auto;
}
.roleSelect:disabled {
  opacity: 0.65;
  cursor: default;
}
.roleSelectChevron {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 11px;
  line-height: 1;
  opacity: 0.85;
}
.role-member {
  background: #f3f3f8;
  border-color: #d8d8e8;
  color: #5a5a72;
}
.role-editor {
  background: #f3f0ff;
  border-color: rgba(79, 61, 255, 0.45);
  color: #4F3DFF;
}
.role-admin {
  background: #4F3DFF;
  border-color: #4F3DFF;
  color: #fff;
}
.role-owner {
  background: linear-gradient(135deg, #5b4dff 0%, #7a3dff 100%);
  border-color: #5b4dff;
  color: #fff;
}
.roleSelectWrap.role-admin .roleSelectChevron,
.roleSelectWrap.role-owner .roleSelectChevron {
  color: #fff;
}

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
.noticeBox { background: #e8f5e9; border: 1px solid #a5d6a7; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); margin-bottom: 12px; }

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
.cardTitleRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.cardTitle { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #4F3DFF; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; width: 100%; min-width: 0; box-sizing: border-box; }
.addParticipantBlock { display: flex; flex-direction: column; gap: 14px; width: 100%; min-width: 0; }
.participantsFilterRow { margin-bottom: 4px; }
.participantsFilterRow .input { width: 100%; max-width: 100%; }
.addParticipantSection { display: flex; flex-direction: column; gap: 8px; width: 100%; min-width: 0; }
.addParticipantLabel { font-family: var(--font-display); font-weight: 700; font-size: 14px; color: #333; }
.photoPickerRow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.photoPreview {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f6ff;
  flex: 0 0 auto;
  font-family: var(--font-display);
  font-size: 11px;
  color: #888;
  text-align: center;
  padding: 4px;
  box-sizing: border-box;
}
.photoPreview.empty { border-style: dashed; }
.photoPreview :deep(img) { width: 100%; height: 100%; object-fit: cover; display: block; }
.photoFileLabel { position: relative; overflow: hidden; cursor: pointer; }
.photoFileInput {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.photoPickerRow .input { flex: 1 1 180px; width: auto; min-width: 160px; }
.formFullWidthInput { width: 100%; flex: 0 0 auto; }
.formPage { max-width: 640px; }
.formStack { display: flex; flex-direction: column; gap: 16px; }
.formActions { margin-top: 4px; }
a.btn { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; }
.inviteSearchRow { align-items: flex-start; }
.inviteSearch { flex: 1 1 0; min-width: 0; max-width: 100%; }
.inviteSearch .input { width: 100%; max-width: 100%; }
.dropdownItem.muted { opacity: 0.65; cursor: default; }
.hint { font-family: var(--font-display); font-size: 14px; opacity: 0.75; }
.input { padding: 12px 14px; border-radius: 12px; border: 1px solid #ddd; font-family: var(--font-display); font-size: 16px; flex: 1 1 0; min-width: 0; max-width: 100%; width: 0; box-sizing: border-box; }
.label { font-family: var(--font-display); font-weight: 700; width: 90px; }
.btn { flex: 0 0 auto; border: none; cursor: pointer; background-color: #4F3DFF; color: white; border-radius: 100px; padding: 10px 14px; font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.btn.iconPlus {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 24px;
  line-height: 1;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
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
.personChipRow { display: flex; flex-direction: column; gap: 6px; }
.scoreCell { font-weight: 700; color: #4F3DFF; text-align: center; }
.scoreCell.score21 { background-color: #ffeb3b; color: #333; border-radius: 4px; }
.dateCell { font-size: 13px; opacity: 0.8; white-space: nowrap; }
.actionsCell { display: flex; gap: 8px; flex-wrap: wrap; }

.matchSection { margin-top: 20px; }
.matchSection:first-child { margin-top: 0; }
.matchSectionTitle { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: #4F3DFF; margin-bottom: 12px; }

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

.matchForm { display: flex; flex-direction: column; gap: 24px; }
.formSection { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #fafaff; border-radius: 12px; }
.sectionTitle { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: #4F3DFF; margin-bottom: 8px; }

.participantSearch { position: relative; }
.dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 8px; margin-top: 4px; max-height: 300px; overflow-y: auto; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.dropdownItem { padding: 10px 14px; cursor: pointer; font-family: var(--font-display); font-size: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dropdownItem:hover { background: #f6f6ff; }

.selectedParticipant { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: white; border: 2px solid #4F3DFF; border-radius: 12px; font-family: var(--font-display); font-weight: 600; }


.scoresRow { display: flex; align-items: center; gap: 12px; }
.scoresLabel { font-family: var(--font-display); font-weight: 700; font-size: 14px; min-width: 60px; }
.scoresInputs { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.scoreInput { width: 60px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-family: var(--font-display); font-size: 14px; text-align: center; }

@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 16px 20px 20px 20px; }
  .title { font-size: 28px; }
}

@media (prefers-color-scheme: dark) {
  .crumb.current,
  .title {
    color: #e8e8e8;
  }

  .role-member {
    background: #343434;
    border-color: #555;
    color: #cfcfcf;
  }
  .role-editor {
    background: #2a2740;
    border-color: #6f62c6;
    color: #c7bcff;
  }
  .role-admin {
    background: #5b4dff;
    border-color: #5b4dff;
    color: #fff;
  }
  .role-owner {
    background: linear-gradient(135deg, #5b4dff 0%, #8a4dff 100%);
    border-color: #6f62c6;
    color: #fff;
  }
  .roleSelect option {
    background: #2d2d2d;
    color: #e8e8e8;
  }

  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }

  .groupNavLink,
  .card {
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


