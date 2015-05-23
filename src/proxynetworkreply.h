#ifndef PROXYNETWORKREPLY_H
#define PROXYNETWORKREPLY_H

#include <QNetworkAccessManager>
#include <QNetworkReply>

class ProxyNetworkReply : public QNetworkReply {
    Q_OBJECT
public:
    // reimplemented from QIODevice
    virtual void close();
    virtual bool isSequential() const;

    virtual void setReadBufferSize(qint64 size);
    ProxyNetworkReply(QNetworkAccessManager* access, QNetworkReply* proxied, QObject* parent = 0);
    virtual ~ProxyNetworkReply();

public Q_SLOTS:
    virtual void abort();
    virtual void ignoreSslErrors();
protected:
    QNetworkReply* m_proxied;
    virtual qint64 writeData(const char *data, qint64 len);
    virtual qint64 readData(char *data, qint64 len);
};
#endif
