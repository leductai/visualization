import { sinhHoanVi } from './sinh-hoan-vi';
import { troChoiGhepChu } from './tro-choi-ghep-chu';
import { lietKeTatCaHoanVi } from './liet-ke-tat-ca-hoan-vi';
import { doMin } from './do-min';
import { tinhDiemMonHoc } from './tinh-diem-mon-hoc';
import { diaChiIp } from './dia-chi-ip';
import { tachChuoiConDoiXung } from './tach-chuoi-con-doi-xung';
import { sudoku } from './sudoku';
import { truyvantong } from './truyvantong';
import { tiemSach } from './tiem_sach';
import { rutBaiTrungThuong } from './rut_bai_trung_thuong';
import { nguoiGiaoCom } from './nguoi_giao_com';
import { duongDiAnToan } from './duong_di_an_toan';
import { doAn } from './do_an';
import { daycontangdainhat } from './daycontangdainhat';
import { daicontangdainhat2 } from './daicontangdainhat2';
import { vachThuoc } from './vach-thuoc';
import { quyHoachTuyenTinh } from './quy-hoach-tuyen-tinh';

export const algorithms = [
  sinhHoanVi,
  troChoiGhepChu,
  lietKeTatCaHoanVi,
  doMin,
  tinhDiemMonHoc,
  diaChiIp,
  tachChuoiConDoiXung,
  sudoku,
  truyvantong,
  tiemSach,
  rutBaiTrungThuong,
  nguoiGiaoCom,
  duongDiAnToan,
  doAn,
  daycontangdainhat,
  daicontangdainhat2,
  vachThuoc,
  quyHoachTuyenTinh,
];

export const findAlgorithm = (id: string) => algorithms.find(a => a.id === id) ?? algorithms[0];
