import { closeShift } from '../lib/pos';

export async function handleCloseShift(shiftId: string, onSuccess: () => void, onError: (msg: string) => void) {
  try {
    // يمكن تلخيص بيانات الوردية هنا أو تمرير ملخص فارغ
    await closeShift(shiftId, {});
    onSuccess();
  } catch (err) {
    onError('حدث خطأ أثناء إغلاق الوردية');
  }
}
