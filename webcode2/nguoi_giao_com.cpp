#include <iostream>
using namespace std;

const int SO_MUC = 19;

int dauCanh[400010];
int canhTiep[400010];
int dauDinh[200005];
int soCanh = 0;

int doSau[200005];
int cha[200005][SO_MUC];
int stackDinh[200005];

void themCanh(int a, int b) {
    dauCanh[++soCanh] = b;
    canhTiep[soCanh] = dauDinh[a];
    dauDinh[a] = soCanh;
}

void dfs(int goc) {
    int top = 0;
    stackDinh[++top] = goc;
    cha[goc][0] = 0;
    doSau[goc] = 0;

    while (top > 0) {
        int u = stackDinh[top--];
        for (int e = dauDinh[u]; e != 0; e = canhTiep[e]) {
            int v = dauCanh[e];
            if (v != cha[u][0]) {
                cha[v][0] = u;
                doSau[v] = doSau[u] + 1;
                for (int k = 1; k < SO_MUC; k++) {
                    cha[v][k] = cha[cha[v][k-1]][k-1];
                }
                stackDinh[++top] = v;
            }
        }
    }
}

int chaChung(int u, int v) {
    if (doSau[u] < doSau[v]) {
        int tam = u;
        u = v;
        v = tam;
    }

    int chenh = doSau[u] - doSau[v];
    for (int k = 0; k < SO_MUC; k++) {
        if (chenh & (1 << k)) {
            u = cha[u][k];
        }
    }

    if (u == v) {
        return u;
    }

    for (int k = SO_MUC - 1; k >= 0; k--) {
        if (cha[u][k] != cha[v][k]) {
            u = cha[u][k];
            v = cha[v][k];
        }
    }

    return cha[u][0];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int soDinh, soTruyVan;
    cin >> soDinh >> soTruyVan;

    for (int i = 0; i < soDinh - 1; i++) {
        int a, b;
        cin >> a >> b;
        themCanh(a, b);
        themCanh(b, a);
    }

    dfs(1);

    for (int i = 0; i < soTruyVan; i++) {
        int a, b;
        cin >> a >> b;
        int c = chaChung(a, b);
        cout << doSau[a] + doSau[b] - 2 * doSau[c] << '\n';
    }

    return 0;
}