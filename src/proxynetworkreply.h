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
    void metaDataChanged();
    void finished();
    void error(NetworkError);
    void encrypted();
    void sslErrors(const QList<QSslError>&);
    void uploadProgress(qint64, qint64);
    void downloadProgress(qint64, qint64);
    void aboutToClose();
    void bytesWritten(qint64);
    void readChannelFinished();
    void readyRead();
protected:
    QNetworkReply* m_proxied;
    virtual qint64 writeData(const char *data, qint64 len);
    virtual qint64 readData(char *data, qint64 len);
};
#endif
