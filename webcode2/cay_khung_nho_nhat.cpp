#include <bits/stdc++.h>
using namespace std;
// Cay khung nho nhat bang QUAY LUI: duyet nhi phan chon / bo tung canh.
// Cat nhanh bang kiem tra chu trinh (DSU) va can tong hien tai >= totNhat.
int n, m;
struct Canh { int u, v, w; };
vector<Canh> e;
vector<int> cha;
int goc(int x) { return cha[x] == x ? x : cha[x] = goc(cha[x]); }
bool taoChuTrinh(int u, int v) { return goc(u) == goc(v); }
void hopNhat(int u, int v) { cha[goc(u)] = goc(v); }
int totNhat = INT_MAX;
vector<int> chon, dapAn;
void quayLui(int i, int daChon, int tong) {
    if (tong >= totNhat) return; // cat nhanh theo can
    if (i == m) {
        if (daChon == n - 1) { totNhat = tong; dapAn = chon; }
        return;
    }
    // Nhanh chon canh e[i] neu khong tao chu trinh.
    if (!taoChuTrinh(e[i].u, e[i].v)) {
        vector<int> luu = cha;
        hopNhat(e[i].u, e[i].v);
        chon.push_back(i);
        quayLui(i + 1, daChon + 1, tong + e[i].w);
        chon.pop_back(); // hoan tac
        cha = luu;
    }
    // Nhanh bo qua canh e[i] neu van con du canh de du n - 1.
    if (daChon + (m - i - 1) >= n - 1) quayLui(i + 1, daChon, tong); // boQua
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    if (!(cin >> n >> m)) return 0;
    e.resize(m);
    for (int i = 0; i < m; i++) { cin >> e[i].u >> e[i].v >> e[i].w; --e[i].u; --e[i].v; }
    cha.resize(n);
    iota(cha.begin(), cha.end(), 0);
    quayLui(0, 0, 0);
    if (totNhat == INT_MAX) { cout << "vo_nghiem"; return 0; }
    cout << totNhat;
    return 0;
}
