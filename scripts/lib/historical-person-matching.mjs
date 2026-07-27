export function isHistoricalPersonTemporallyPlausible(person, year, options = {}) {
  if (!Number.isInteger(year)) return true;
  const tolerance = options.personDateTolerance ?? 3;
  const maximumLifespan = options.maximumPersonLifespan ?? 110;
  const birthYear = person.birthYear ?? person.birth_year;
  const deathYear = person.deathYear ?? person.death_year;
  if (Number.isInteger(birthYear) && year < birthYear - tolerance) return false;
  if (Number.isInteger(deathYear) && year > deathYear + tolerance) return false;
  if (!Number.isInteger(birthYear) && Number.isInteger(deathYear) && year < deathYear - maximumLifespan) return false;
  if (Number.isInteger(birthYear) && !Number.isInteger(deathYear) && year > birthYear + maximumLifespan) return false;
  return true;
}
