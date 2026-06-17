#!/usr/bin/env bash
# =============================================================================
# install_global.sh
# Devio AI Agency — Global Skill Manager (Linux / macOS)
#
# Manages agency-* skills in the Google Antigravity global skills directory
# so they are available across ALL your projects.
#
# Interactive usage (shows menu):
#   ./install_global.sh
#
# Non-interactive usage (for scripting / CI):
#   ./install_global.sh --install
#   ./install_global.sh --update
#   ./install_global.sh --uninstall
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SRC="${SCRIPT_DIR}/.agent/skills"
SKILLS_DST="${HOME}/.gemini/antigravity/skills"

# --- Colours ---
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

# =============================================================================
# UI Helpers
# =============================================================================

print_header() {
  echo ""
  echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║     Devio AI Agency — Global Skill Manager   ║${NC}"
  echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${DIM}Source:      ${SKILLS_SRC}${NC}"
  echo -e "  ${DIM}Destination: ${SKILLS_DST}${NC}"
  echo ""
}

confirm() {
  local prompt="$1"
  local answer
  read -r -p "$(echo -e "${YELLOW}${prompt} [y/N]: ${NC}")" answer
  [[ "${answer,,}" == "y" ]]
}

count_skills() {
  # Count all agency-* source skill directories
  local n=0
  for skill_dir in "${SKILLS_SRC}"/agency-*/; do
    [ -d "${skill_dir}" ] && n=$((n + 1)) || true
  done
  echo "${n}"
}

count_installed() {
  # Count which of those are already installed globally
  local n=0
  for skill_dir in "${SKILLS_SRC}"/agency-*/; do
    [ -d "${skill_dir}" ] || continue
    local skill_name
    skill_name=$(basename "${skill_dir}")
    local dst="${SKILLS_DST}/${skill_name}"
    [ -d "${dst}" ] && n=$((n + 1)) || true
  done
  echo "${n}"
}

# =============================================================================
# Actions
# =============================================================================

do_install() {
  print_header
  echo -e "${GREEN}${BOLD}▸ Installing skills globally...${NC}"
  echo ""

  if [ ! -d "${SKILLS_SRC}" ]; then
    echo -e "${RED}ERROR: Skills source directory not found: ${SKILLS_SRC}${NC}"
    exit 1
  fi

  mkdir -p "${SKILLS_DST}"

  local installed=0
  local skipped=0
  for skill_dir in "${SKILLS_SRC}"/agency-*/; do
    [ -d "${skill_dir}" ] || continue
    local skill_name
    skill_name=$(basename "${skill_dir}")
    local dst="${SKILLS_DST}/${skill_name}"

    if [ -d "${dst}" ]; then
      echo -e "  ${YELLOW}⚠  Already installed — skipped:${NC} ${skill_name}"
      echo -e "  ${DIM}   Run 'Update' to overwrite existing skills.${NC}"
      skipped=$((skipped + 1))
    else
      cp -r "${skill_dir}" "${dst}"
      echo -e "  ${GREEN}✓ Installed:${NC} ${skill_name}"
      installed=$((installed + 1))
    fi
  done

  echo ""
  echo -e "${GREEN}✅ Done. ${installed} installed, ${skipped} skipped.${NC}"
  echo -e "${DIM}   Location: ${SKILLS_DST}${NC}"
  echo ""
  echo -e "${YELLOW}Note:${NC} Workspace skills in .agent/skills/ always take precedence"
  echo -e "      over global skills when inside this project."
  echo ""
}

do_update() {
  print_header
  echo -e "${CYAN}${BOLD}▸ Updating (reinstalling) skills globally...${NC}"
  echo ""

  if [ ! -d "${SKILLS_SRC}" ]; then
    echo -e "${RED}ERROR: Skills source directory not found: ${SKILLS_SRC}${NC}"
    exit 1
  fi

  mkdir -p "${SKILLS_DST}"

  local updated=0
  local fresh=0
  for skill_dir in "${SKILLS_SRC}"/agency-*/; do
    [ -d "${skill_dir}" ] || continue
    local skill_name
    skill_name=$(basename "${skill_dir}")
    local dst="${SKILLS_DST}/${skill_name}"

    if [ -d "${dst}" ]; then
      rm -rf "${dst}"
      cp -r "${skill_dir}" "${dst}"
      echo -e "  ${CYAN}↻ Updated:${NC} ${skill_name}"
      updated=$((updated + 1))
    else
      cp -r "${skill_dir}" "${dst}"
      echo -e "  ${GREEN}✓ Installed (new):${NC} ${skill_name}"
      fresh=$((fresh + 1))
    fi
  done

  echo ""
  echo -e "${GREEN}✅ Done. ${updated} updated, ${fresh} newly installed.${NC}"
  echo -e "${DIM}   Location: ${SKILLS_DST}${NC}"
  echo ""
}

do_uninstall() {
  print_header
  echo -e "${RED}${BOLD}▸ Uninstalling globally installed skills...${NC}"
  echo ""

  local count
  count=$(count_installed)

  if [ "${count}" -eq 0 ]; then
    echo -e "${YELLOW}No globally installed Devio skills found. Nothing to remove.${NC}"
    echo ""
    return
  fi

  echo -e "${DIM}The following skills will be removed from: ${SKILLS_DST}${NC}"
  echo ""
  for skill_dir in "${SKILLS_SRC}"/agency-*/; do
    [ -d "${skill_dir}" ] || continue
    local skill_name
    skill_name=$(basename "${skill_dir}")
    local dst="${SKILLS_DST}/${skill_name}"
    [ -d "${dst}" ] && echo -e "  ${RED}✗${NC} ${skill_name}" || true
  done
  echo ""

  if ! confirm "Are you sure you want to remove these ${count} skill(s)?"; then
    echo -e "${YELLOW}Aborted. Nothing was changed.${NC}"
    echo ""
    return
  fi

  local removed=0
  for skill_dir in "${SKILLS_SRC}"/agency-*/; do
    [ -d "${skill_dir}" ] || continue
    local skill_name
    skill_name=$(basename "${skill_dir}")
    local dst="${SKILLS_DST}/${skill_name}"
    if [ -d "${dst}" ]; then
      rm -rf "${dst}"
      echo -e "  ${RED}✗ Removed:${NC} ${skill_name}"
      removed=$((removed + 1))
    fi
  done

  echo ""
  echo -e "${GREEN}✅ Uninstalled ${removed} skill(s).${NC}"
  echo ""
}

# =============================================================================
# Interactive Menu
# =============================================================================

show_menu() {
  print_header

  local installed_count total_count
  installed_count=$(count_installed)
  total_count=$(count_skills)

  echo -e "  ${DIM}Status: ${installed_count}/${total_count} skills currently installed globally.${NC}"
  echo ""
  echo -e "  ${BOLD}What would you like to do?${NC}"
  echo ""

  local PS3
  PS3="$(echo -e "  ${CYAN}Enter choice [1-4]: ${NC}")"

  local options=(
    "Install   — copy new skills to global directory (skips existing)"
    "Update    — reinstall all skills, overwriting any existing versions"
    "Uninstall — remove all globally installed Devio skills"
    "Exit"
  )

  select opt in "${options[@]}"; do
    case "${REPLY}" in
      1) do_install;    break ;;
      2) do_update;     break ;;
      3) do_uninstall;  break ;;
      4)
        echo ""
        echo -e "${DIM}Goodbye.${NC}"
        echo ""
        exit 0
        ;;
      *)
        echo -e "${YELLOW}  Invalid choice. Please enter 1, 2, 3 or 4.${NC}"
        ;;
    esac
  done
}

# =============================================================================
# Entry Point
# =============================================================================

case "${1:-}" in
  --install|-i)    do_install    ;;
  --update|-u)     do_update     ;;
  --uninstall|-r)  do_uninstall  ;;
  "")              show_menu     ;;
  *)
    echo -e "${RED}Unknown option: ${1}${NC}"
    echo ""
    echo "Usage:"
    echo "  ./install_global.sh              # interactive menu"
    echo "  ./install_global.sh --install    # install new skills only"
    echo "  ./install_global.sh --update     # reinstall / overwrite all skills"
    echo "  ./install_global.sh --uninstall  # remove all globally installed skills"
    echo ""
    exit 1
    ;;
esac
