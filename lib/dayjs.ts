import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const TZ = 'Asia/Jakarta';

export const nowWIB = () => dayjs().tz(TZ);

export const formatWIB = (date: Date | string) =>
    dayjs(date).tz(TZ).format('YYYY-MM-DD HH:mm:ss');

export default dayjs;
