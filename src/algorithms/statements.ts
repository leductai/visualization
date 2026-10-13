import troChoiGhepChu from '../../webcode/tro-choi-ghep-chu.txt?raw';
import tinhDiemMonHoc from '../../webcode/tinh-diem-mon-hoc.txt?raw';
import tachChuoiConDoiXung from '../../webcode/tach-chuoi-con-doi-xung.txt?raw';
import sudoku from '../../webcode/sudoku.txt?raw';
import sinhHoanVi from '../../webcode/sinh-hoan-vi.txt?raw';
import lietKeTatCaHoanVi from '../../webcode/liet-ke-tat-ca-hoan-vi.txt?raw';
import doMin from '../../webcode/do-min.txt?raw';
import diaChiIp from '../../webcode/dia-chi-ip.txt?raw';
import truyvantong from '../../webcode2/truyvantong.md?raw';
import tiemSach from '../../webcode2/tiem_sach.md?raw';
import rutBaiTrungThuong from '../../webcode2/rut_bai_trung_thuong.md?raw';
import nguoiGiaoCom from '../../webcode2/nguoi_giao_com.md?raw';
import duongDiAnToan from '../../webcode2/duong_di_an_toan.md?raw';
import doAn from '../../webcode2/do_an.md?raw';
import daycontangdainhat from '../../webcode2/daycontangdainhat.md?raw';
import daicontangdainhat2 from '../../webcode2/daicontangdainhat2.md?raw';
import timDuongDi from '../../webcode2/tim_duong_di.md?raw';
import lietKeNhiPhan from '../../webcode/liet-ke-nhi-phan.txt?raw';
import sapXepTron from '../../webcode2/merge_sort.md?raw';

/** Đề bài gốc theo id thuật toán. 4 bài (vach-thuoc, quy-hoach-tuyen-tinh,
 *  cay-khung-nho-nhat, day-con-chung-dai-nhat) chưa có file đề nên App dùng
 *  nội dung dự phòng dựng từ metadata. */
export const statements: Record<string, string> = {
  'tro-choi-ghep-chu': troChoiGhepChu,
  'tinh-diem-mon-hoc': tinhDiemMonHoc,
  'tach-chuoi-con-doi-xung': tachChuoiConDoiXung,
  'sudoku': sudoku,
  'sinh-hoan-vi': sinhHoanVi,
  'liet-ke-tat-ca-hoan-vi': lietKeTatCaHoanVi,
  'do-min': doMin,
  'dia-chi-ip': diaChiIp,
  'truyvantong': truyvantong,
  'tiem_sach': tiemSach,
  'rut_bai_trung_thuong': rutBaiTrungThuong,
  'nguoi_giao_com': nguoiGiaoCom,
  'duong_di_an_toan': duongDiAnToan,
  'do_an': doAn,
  'daycontangdainhat': daycontangdainhat,
  'daicontangdainhat2': daicontangdainhat2,
  'tim-duong-di': timDuongDi,
  'liet-ke-nhi-phan': lietKeNhiPhan,
  'sap-xep-tron': sapXepTron,
};
