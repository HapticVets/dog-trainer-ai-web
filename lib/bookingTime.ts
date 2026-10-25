// Ohio wall-clock time, independent of the owner's device timezone.
export function easternTime(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Choose a valid day and time.');
  const target = Date.parse(value+'Z');
  let guess = target;
  const formatter = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  for(let i=0;i<4;i++) {
    const wall = formatter.format(new Date(guess)).replace(' ','T');
    if (wall===value) {
      if (formatter.format(new Date(guess+3600000)).replace(' ','T')===value || formatter.format(new Date(guess-3600000)).replace(' ','T')===value) throw new Error('That time repeats during the clock change. Choose another time.');
      return new Date(guess).toISOString();
    }
    guess += target-Date.parse(wall+'Z');
  }
  throw new Error('That local time does not exist during the clock change. Choose another time.');
}
